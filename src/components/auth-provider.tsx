"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  ACCOUNTS_STORAGE_KEY,
  AUTH_STORAGE_KEY,
  DEMO_ACCOUNTS,
  normalizeEmail,
  normalizePaymentSettings,
  normalizeRole,
  toPublicUser,
  type AuthRole,
  type AuthUser,
  type GoogleChoice,
  type PaymentSettings,
  type StoredAccount,
} from "@/lib/auth"
import {
  clearOnboardingDone,
  isOnboardingMarkedDone,
  markOnboardingDone,
  normalizeOnboardingStep,
  preferOnboardingStep,
  type BusinessFieldId,
  type BusinessService,
} from "@/lib/onboarding"
import {
  applyCloudProfile,
  canCloudSync,
  cloudFromSessionUser,
  profileFromAuthMetadata,
  profileLooksComplete,
  profileToAuthMetadata,
  pullOwnerCloud,
  pushOwnerProfile,
} from "@/lib/cloud-sync"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import { nowIso } from "@/lib/trial"

type AuthResult =
  | { ok: true; user: AuthUser; notice?: string }
  | { ok: false; error: string }

type AuthContextValue = {
  ready: boolean
  user: AuthUser | null
  supabaseReady: boolean
  googleEnabled: boolean
  /** Pesan sinkron lintas perangkat (konfirmasi email, unggah data, dll). */
  syncNotice: string | null
  dismissSyncNotice: () => void
  login: (email: string, password: string) => Promise<AuthResult>
  register: (input: {
    name: string
    email: string
    password: string
  }) => Promise<AuthResult>
  continueWithGoogle: (choice: GoogleChoice, role?: AuthRole) => Promise<AuthResult>
  startGoogleOAuth: (nextPath?: string) => Promise<AuthResult>
  /** Owner-only: persist studio wilayah on the account profile. */
  updateOwnerCity: (city: string) => Promise<void>
  /** Merge profile / onboarding fields into the signed-in account. */
  updateProfile: (patch: Partial<AuthUser>) => Promise<AuthUser | null>
  /** Hubungkan akun lokal ke Supabase lalu unggah profil (untuk HP lain). */
  linkCloudAccount: () => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return [...DEMO_ACCOUNTS]
    const parsed = JSON.parse(raw) as StoredAccount[]
    if (!Array.isArray(parsed)) return [...DEMO_ACCOUNTS]
    const extras = parsed.filter(
      (account) => !DEMO_ACCOUNTS.some((demo) => demo.email === normalizeEmail(account.email))
    )
    return [...DEMO_ACCOUNTS, ...extras]
  } catch {
    return [...DEMO_ACCOUNTS]
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  const extras = accounts.filter(
    (account) => !DEMO_ACCOUNTS.some((demo) => demo.email === normalizeEmail(account.email))
  )
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(extras))
}

function readLocalAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.email || !parsed?.id) return null
    return {
      ...parsed,
      provider: parsed.provider ?? "password",
      role: normalizeRole(parsed.role),
      onboardingStep: normalizeOnboardingStep(parsed.onboardingStep),
    }
  } catch {
    return null
  }
}

function findStoredAccount(email: string): StoredAccount | undefined {
  return readAccounts().find((item) => item.email === normalizeEmail(email))
}

function persistAuthUser(nextUser: AuthUser) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    return
  } catch {
    // Logo base64 bisa melebihi kuota — simpan tanpa logo.
    try {
      const slim = { ...nextUser, logoDataUrl: undefined }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(slim))
    } catch {
      // Biarkan sesi tetap di memori.
    }
  }
}

function mergeRemoteWithLocal(remote: AuthUser, local: AuthUser | null): AuthUser {
  const email = normalizeEmail(local?.email || remote.email)
  const markedDone = isOnboardingMarkedDone(email)
  if (!local || normalizeEmail(local.email) !== normalizeEmail(remote.email)) {
    return {
      ...remote,
      onboardingStep: markedDone
        ? "done"
        : normalizeOnboardingStep(remote.onboardingStep),
    }
  }
  const step = markedDone
    ? "done"
    : preferOnboardingStep(local.onboardingStep, remote.onboardingStep)
  return {
    ...remote,
    name: local.name || remote.name,
    phone: local.phone || remote.phone,
    city: local.city || remote.city,
    studioName: local.studioName || remote.studioName,
    role: normalizeRole(local.role || remote.role),
    trialStartedAt: local.trialStartedAt || remote.trialStartedAt,
    onboardingStep: step,
    businessEmail: local.businessEmail || remote.businessEmail,
    instagram: local.instagram || remote.instagram,
    address: local.address || remote.address,
    logoDataUrl: local.logoDataUrl || remote.logoDataUrl,
    businessFields:
      (local.businessFields as BusinessFieldId[] | undefined) || remote.businessFields,
    customBusinessFields:
      local.customBusinessFields?.length
        ? local.customBusinessFields
        : remote.customBusinessFields,
    services: (local.services as BusinessService[] | undefined) || remote.services,
    paymentSettings: local.paymentSettings || remote.paymentSettings,
    subscription: local.subscription || remote.subscription,
    avatar: local.avatar || remote.avatar,
  }
}

function resolveSessionUser(
  id: string,
  email: string,
  metadata: Record<string, unknown> | undefined,
  provider: AuthUser["provider"]
): AuthUser {
  const remote = userFromMetadata(id, email, metadata, provider)
  const localSession = readLocalAuthUser()
  const stored = findStoredAccount(email)
  const local = localSession ?? (stored ? toPublicUser(stored) : null)
  return withTrial(mergeRemoteWithLocal(remote, local))
}

function userFromMetadata(
  id: string,
  email: string,
  metadata: Record<string, unknown> | undefined,
  provider: AuthUser["provider"]
): AuthUser {
  const fromCloud = profileFromAuthMetadata(metadata)
  const name =
    fromCloud.name ||
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    email.split("@")[0]
  return {
    id,
    email,
    name,
    city: fromCloud.city || "",
    studioName: fromCloud.studioName || "",
    phone: fromCloud.phone || "",
    provider,
    role: normalizeRole(fromCloud.role ?? metadata?.role),
    trialStartedAt: fromCloud.trialStartedAt || nowIso(),
    onboardingStep: normalizeOnboardingStep(fromCloud.onboardingStep),
    businessEmail: fromCloud.businessEmail,
    instagram: fromCloud.instagram,
    address: fromCloud.address,
    logoDataUrl: fromCloud.logoDataUrl,
    businessFields: fromCloud.businessFields as BusinessFieldId[] | undefined,
    customBusinessFields: fromCloud.customBusinessFields,
    services: fromCloud.services as BusinessService[] | undefined,
    paymentSettings: fromCloud.paymentSettings
      ? normalizePaymentSettings(fromCloud.paymentSettings as PaymentSettings)
      : undefined,
    subscription: fromCloud.subscription,
  }
}

function withTrial(user: AuthUser): AuthUser {
  if (user.trialStartedAt) return user
  return { ...user, trialStartedAt: nowIso() }
}

/** Ambil pilihan role dari halaman daftar sebelum OAuth Google redirect. */
function withPendingRegisterRole(user: AuthUser): AuthUser {
  if (typeof window === "undefined") return user
  try {
    const pending = sessionStorage.getItem("key-assistant.register-role")
    if (!pending) return user
    sessionStorage.removeItem("key-assistant.register-role")
    const role = normalizeRole(pending)
    if (role === user.role) return user
    const next = { ...user, role }
    if (supabase && !isDemoEmail(user.email)) {
      void supabase.auth.updateUser({ data: { role } })
    }
    return next
  } catch {
    return user
  }
}

function persistAccountTrial(email: string, trialStartedAt: string) {
  const accounts = readAccounts()
  const index = accounts.findIndex((item) => item.email === normalizeEmail(email))
  if (index < 0) return
  if (accounts[index].trialStartedAt) return
  const next = [...accounts]
  next[index] = { ...next[index], trialStartedAt }
  writeAccounts(next)
}

function isDemoEmail(email: string) {
  const value = normalizeEmail(email)
  return (
    DEMO_ACCOUNTS.some((account) => account.email === value) ||
    value.endsWith("@riasaja.id")
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    function restoreLocalUser() {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        if (!raw) return false
        const parsed = JSON.parse(raw) as AuthUser
        if (parsed?.email && parsed?.id) {
          const markedDone = isOnboardingMarkedDone(parsed.email)
          const next = withTrial({
            ...parsed,
            provider: parsed.provider ?? "password",
            role: normalizeRole(parsed.role),
            onboardingStep: markedDone
              ? "done"
              : normalizeOnboardingStep(parsed.onboardingStep),
          })
          setUser(next)
          persistAccountTrial(next.email, next.trialStartedAt!)
          return true
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
      return false
    }

    // Sesi lokal dulu supaya tombol Masuk tidak menunggu jaringan Supabase.
    restoreLocalUser()
    setReady(true)
    try {
      const storedNotice = sessionStorage.getItem("key-assistant.sync-notice")
      if (storedNotice) {
        setSyncNotice(storedNotice)
        sessionStorage.removeItem("key-assistant.sync-notice")
      }
    } catch {
      // ignore
    }

    async function hydrateSupabase() {
      if (!supabase || !active) return

      try {
        const settings = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            },
            signal: AbortSignal.timeout(4000),
          }
        ).then((response) => response.json())
        if (active) setGoogleEnabled(Boolean(settings?.external?.google))
      } catch {
        if (active) setGoogleEnabled(false)
      }

      async function hydrateFromSession(
        sessionUser: {
          id: string
          email?: string | null
          user_metadata?: Record<string, unknown>
          app_metadata?: { provider?: string }
        }
      ) {
        if (!sessionUser.email) return
        let merged = withPendingRegisterRole(
          resolveSessionUser(
            sessionUser.id,
            sessionUser.email,
            sessionUser.user_metadata as Record<string, unknown>,
            sessionUser.app_metadata?.provider === "google" ? "google" : "password"
          )
        )
        if (canCloudSync(merged.email)) {
          const sessionCloud = cloudFromSessionUser(sessionUser)
          if (sessionCloud?.profile) {
            merged = applyCloudProfile(merged, sessionCloud.profile)
          }
          const cloud = await pullOwnerCloud(sessionUser.id)
          if (cloud?.profile) {
            merged = applyCloudProfile(merged, cloud.profile)
          }
          if (profileLooksComplete(merged)) {
            void pushOwnerProfile(merged)
          }
          if (merged.onboardingStep === "done") markOnboardingDone(merged.email)
        }
        if (!active) return
        setUser(merged)
        persistAuthUser(merged)
      }

      try {
        const { data } = await supabase.auth.getSession()
        if (active && data.session?.user) {
          await hydrateFromSession(data.session.user)
        }
      } catch {
        // Tetap pakai sesi lokal.
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return
        const next = session?.user
        if (next?.email) {
          void hydrateFromSession(next)
          return
        }
        restoreLocalUser()
      })
      unsubscribe = () => listener.subscription.unsubscribe()
    }

    void hydrateSupabase()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (user) {
      persistAuthUser(user)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [ready, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      supabaseReady: supabaseConfigured,
      googleEnabled,
      syncNotice,
      dismissSyncNotice: () => setSyncNotice(null),
      login: async (email, password) => {
        const normalized = normalizeEmail(email)
        const pass = password.trim()
        if (!normalized || !pass) {
          return { ok: false, error: "Email dan kata sandi wajib diisi." }
        }
        if (pass.length < 6) {
          return { ok: false, error: "Kata sandi minimal 6 karakter." }
        }

        const accounts = readAccounts()
        const localAccount = accounts.find((item) => item.email === normalized)

        // Utamakan Auth Supabase agar profil + studio ikut email di HP / perangkat lain.
        if (supabase && !isDemoEmail(normalized)) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: normalized,
              password: pass,
            })
            if (!error && data.user?.email) {
              let publicUser = withTrial(
                userFromMetadata(
                  data.user.id,
                  data.user.email,
                  data.user.user_metadata as Record<string, unknown>,
                  "password"
                )
              )
              // Metadata dari login (sumber utama lintas perangkat).
              const sessionCloud = cloudFromSessionUser(data.user)
              if (sessionCloud?.profile) {
                publicUser = applyCloudProfile(publicUser, sessionCloud.profile)
              }
              // Data lokal di perangkat ini (jika ada) mengisi gap — lalu diunggah ke cloud.
              if (localAccount && localAccount.password === pass) {
                publicUser = applyCloudProfile(
                  {
                    ...toPublicUser(localAccount),
                    id: data.user.id,
                    email: data.user.email,
                    provider: "password",
                  },
                  publicUser
                )
              }
              if (canCloudSync(publicUser.email)) {
                const cloud = await pullOwnerCloud(data.user.id)
                if (cloud?.profile) {
                  publicUser = applyCloudProfile(publicUser, cloud.profile)
                }
                // Selalu unggah profil gabungan supaya HP lain dapat salinan terbaru.
                void pushOwnerProfile(publicUser)
                if (publicUser.onboardingStep === "done") {
                  markOnboardingDone(publicUser.email)
                }
              }
              // Cache akun lokal agar offline tetap bisa (password sama).
              const nextAccounts = [...accounts]
              const idx = nextAccounts.findIndex((item) => item.email === normalized)
              const stored: StoredAccount = {
                ...(idx >= 0 ? nextAccounts[idx] : { password: pass }),
                ...publicUser,
                password: pass,
              }
              if (idx >= 0) nextAccounts[idx] = stored
              else nextAccounts.push(stored)
              writeAccounts(nextAccounts)

              setUser(publicUser)
              persistAuthUser(publicUser)
              return { ok: true, user: publicUser }
            }
            if (error?.message?.toLowerCase().includes("email not confirmed")) {
              return {
                ok: false,
                error:
                  "Email belum dikonfirmasi. Cek kotak masuk / spam, lalu konfirmasi sebelum masuk di HP lain.",
              }
            }
            // Kata sandi / akun salah di cloud — jangan buat akun kosong baru.
            if (error && !localAccount) {
              const msg = error.message?.toLowerCase() || ""
              if (msg.includes("invalid") || msg.includes("credentials")) {
                return {
                  ok: false,
                  error:
                    "Email atau kata sandi salah. Pakai email yang sama saat daftar, atau daftar dulu di /daftar.",
                }
              }
              return { ok: false, error: error.message || "Gagal masuk." }
            }
          } catch {
            // Jaringan gagal — coba akun lokal di bawah.
          }
        }

        if (localAccount) {
          if (localAccount.password !== pass) {
            return { ok: false, error: "Kata sandi salah." }
          }
          const publicUser = withTrial(toPublicUser(localAccount))
          if (!localAccount.trialStartedAt && publicUser.trialStartedAt) {
            persistAccountTrial(publicUser.email, publicUser.trialStartedAt)
          }
          setUser(publicUser)
          persistAuthUser(publicUser)
          return { ok: true, user: publicUser }
        }

        // Tanpa Supabase / demo: buat sesi lokal agar bisa coba tanpa daftar ulang.
        if (supabaseConfigured && !isDemoEmail(normalized)) {
          return {
            ok: false,
            error:
              "Akun tidak ditemukan. Daftar dulu dengan email ini di /daftar agar data tersimpan ke cloud dan bisa dibuka di HP lain.",
          }
        }

        const name = normalized.split("@")[0] || "Pengguna"
        const account: StoredAccount = {
          id: crypto.randomUUID(),
          name,
          email: normalized,
          phone: "",
          city: "",
          studioName: "",
          password: pass,
          provider: "password",
          role: "owner",
          onboardingStep: 2,
          trialStartedAt: nowIso(),
        }
        writeAccounts([...accounts, account])
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        persistAuthUser(publicUser)
        return { ok: true, user: publicUser }
      },
      register: async (input) => {
        const email = normalizeEmail(input.email)
        if (!input.name.trim() || !email || !input.password.trim()) {
          return { ok: false, error: "Nama, email, dan kata sandi wajib diisi." }
        }
        if (input.password.trim().length < 8) {
          return { ok: false, error: "Kata sandi minimal 8 karakter." }
        }

        const accounts = readAccounts()
        if (accounts.some((item) => item.email === email)) {
          return { ok: false, error: "Email ini sudah terdaftar. Silakan masuk." }
        }

        const trialStartedAt = nowIso()
        let accountId = crypto.randomUUID()
        let needsEmailConfirm = false
        let hasCloudSession = false

        // Utamakan Auth Supabase supaya ID sama di semua perangkat.
        if (supabase && !isDemoEmail(email)) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password: input.password.trim(),
              options: {
                data: {
                  name: input.name.trim(),
                  role: "owner",
                  onboarding_step: 2,
                  trial_started_at: trialStartedAt,
                },
                emailRedirectTo:
                  typeof window !== "undefined" ? `${window.location.origin}/masuk` : undefined,
              },
            })
            if (error) {
              const msg = error.message?.toLowerCase() || ""
              if (
                msg.includes("already") ||
                msg.includes("registered") ||
                msg.includes("exists")
              ) {
                return {
                  ok: false,
                  error:
                    "Email ini sudah terdaftar. Silakan masuk di /masuk dengan kata sandi yang sama.",
                }
              }
              return {
                ok: false,
                error:
                  error.message ||
                  "Gagal mendaftar ke cloud. Cek koneksi, lalu coba lagi.",
              }
            }
            if (data.user?.id) {
              accountId = data.user.id
            }
            if (data.session) {
              hasCloudSession = true
            } else if (data.user) {
              // Supabase wajib konfirmasi email — sesi belum ada sampai link diklik.
              needsEmailConfirm = true
              try {
                sessionStorage.setItem(
                  "key-assistant.email-confirm",
                  JSON.stringify({ email, at: Date.now() })
                )
              } catch {
                // ignore
              }
            }
          } catch {
            return {
              ok: false,
              error:
                "Tidak bisa terhubung ke cloud. Cek internet, lalu daftar ulang supaya akun bisa dibuka di HP lain.",
            }
          }
        }

        const account: StoredAccount = {
          id: accountId,
          name: input.name.trim(),
          email,
          phone: "",
          city: "",
          studioName: "",
          password: input.password.trim(),
          provider: "password",
          role: "owner",
          onboardingStep: 2,
          businessEmail: email,
          trialStartedAt,
        }

        writeAccounts([...accounts, account])
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        persistAuthUser(publicUser)
        if (hasCloudSession) {
          void pushOwnerProfile(publicUser)
        }

        if (needsEmailConfirm) {
          const notice =
            "Cek email untuk konfirmasi akun. Setelah konfirmasi, di perangkat ini tekan “Simpan ke cloud”, baru data bisa dibuka di HP lain dengan email yang sama."
          setSyncNotice(notice)
          return { ok: true, user: publicUser, notice }
        }

        return { ok: true, user: publicUser }
      },
      continueWithGoogle: async (choice, role = "owner") => {
        const email = normalizeEmail(choice.email)
        if (!email) {
          return { ok: false, error: "Email Google tidak valid." }
        }
        const accounts = readAccounts()
        const existing = accounts.find((item) => item.email === email)
        if (existing) {
          const publicUser = withTrial(
            toPublicUser({
              ...existing,
              provider: "google",
              name: existing.name || choice.name,
              role: normalizeRole(existing.role),
            })
          )
          if (!existing.trialStartedAt && publicUser.trialStartedAt) {
            persistAccountTrial(publicUser.email, publicUser.trialStartedAt)
          }
          setUser(publicUser)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(publicUser))
          return { ok: true, user: publicUser }
        }
        const nextRole = normalizeRole(role)
        const account: StoredAccount = {
          id: crypto.randomUUID(),
          name: choice.name,
          email,
          phone: "",
          city: "",
          studioName: "",
          password: `google:${email}`,
          provider: "google",
          role: nextRole,
          avatar: choice.initial,
          onboardingStep: nextRole === "owner" ? 2 : undefined,
          businessEmail: email,
          trialStartedAt: nowIso(),
        }
        writeAccounts([...accounts, account])
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(publicUser))
        return { ok: true, user: publicUser }
      },
      startGoogleOAuth: async (nextPath = "/studio") => {
        if (!supabase) {
          return { ok: false, error: "Supabase belum dikonfigurasi." }
        }
        if (!googleEnabled) {
          return {
            ok: false,
            error:
              "Provider Google belum aktif di Supabase. Pilih Gmail di daftar, atau masukkan Gmail kamu di bawah.",
          }
        }
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/masuk?next=${encodeURIComponent(nextPath)}`
            : undefined
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        })
        if (error) return { ok: false, error: error.message }
        return {
          ok: false,
          error: "Mengalihkan ke Google…",
        }
      },
      updateOwnerCity: async (city) => {
        const nextCity = city.trim()
        if (!nextCity || !user) return
        const nextUser = { ...user, city: nextCity }
        setUser(nextUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))

        const accounts = readAccounts()
        const index = accounts.findIndex((item) => item.email === normalizeEmail(user.email))
        if (index >= 0) {
          const nextAccounts = [...accounts]
          nextAccounts[index] = { ...nextAccounts[index], city: nextCity }
          writeAccounts(nextAccounts)
        }

        if (supabase && !isDemoEmail(user.email)) {
          void supabase.auth.updateUser({ data: { city: nextCity } })
        }
      },
      updateProfile: async (patch) => {
        if (!user) return null
        const nextStep = normalizeOnboardingStep(
          patch.onboardingStep ?? user.onboardingStep
        )
        if (nextStep === "done") {
          markOnboardingDone(user.email)
        } else if (typeof nextStep === "number") {
          clearOnboardingDone(user.email)
        }
        const nextUser: AuthUser = {
          ...user,
          ...patch,
          id: user.id,
          email: user.email,
          provider: user.provider,
          role: normalizeRole(patch.role ?? user.role),
          onboardingStep: isOnboardingMarkedDone(user.email) ? "done" : nextStep,
        }
        // Jika baru di-mark done di atas, pastikan step "done".
        if (nextStep === "done") {
          nextUser.onboardingStep = "done"
        }
        setUser(nextUser)
        persistAuthUser(nextUser)

        const accounts = readAccounts()
        const index = accounts.findIndex((item) => item.email === normalizeEmail(user.email))
        if (index >= 0) {
          const nextAccounts = [...accounts]
          nextAccounts[index] = { ...nextAccounts[index], ...nextUser }
          try {
            writeAccounts(nextAccounts)
          } catch {
            const slimAccounts = nextAccounts.map((account) =>
              account.email === normalizeEmail(user.email)
                ? { ...account, logoDataUrl: undefined }
                : account
            )
            try {
              writeAccounts(slimAccounts)
            } catch {
              // Sesi memori tetap dipakai.
            }
          }
        }

        // Jangan await — updateUser Supabase sering menggantung di jaringan lambat
        // dan membuat tombol "Menyimpan…" stuck. Profil lokal sudah cukup untuk masuk studio.
        if (supabase && !isDemoEmail(user.email)) {
          void supabase.auth
            .updateUser({
              data: {
                name: nextUser.name,
                phone: nextUser.phone,
                city: nextUser.city,
                studio_name: nextUser.studioName,
                role: nextUser.role,
                onboarding_step: nextUser.onboardingStep,
                business_email: nextUser.businessEmail,
                instagram: nextUser.instagram,
                address: nextUser.address,
                business_fields: nextUser.businessFields,
                custom_business_fields: nextUser.customBusinessFields,
                services: nextUser.services,
                payment_settings: nextUser.paymentSettings
                  ? {
                      ...nextUser.paymentSettings,
                      // QRIS base64 bisa besar — jangan kirim ke metadata auth.
                      qrisDataUrl: undefined,
                    }
                  : undefined,
                subscription: nextUser.subscription,
              },
            })
            .catch(() => {
              // Sinkron cloud opsional.
            })
          void pushOwnerProfile(nextUser)
        }
        return nextUser
      },
      linkCloudAccount: async () => {
        if (!user) {
          return { ok: false, error: "Belum masuk." }
        }
        if (!supabase || isDemoEmail(user.email)) {
          return {
            ok: false,
            error: "Akun demo tidak disinkronkan. Daftar dengan email pribadi.",
          }
        }
        const stored = findStoredAccount(user.email)
        if (!stored?.password) {
          return {
            ok: false,
            error:
              "Kata sandi lokal tidak ditemukan. Keluar, lalu masuk ulang dengan email & kata sandi.",
          }
        }

        try {
          const existing = await supabase.auth.getSession()
          if (existing.data.session?.user) {
            const nextUser = {
              ...user,
              id: existing.data.session.user.id,
            }
            setUser(nextUser)
            persistAuthUser(nextUser)
            await pushOwnerProfile(nextUser)
            setSyncNotice(
              "Data sudah diunggah ke cloud. Di HP lain, masuk dengan email & kata sandi yang sama."
            )
            return { ok: true, user: nextUser }
          }

          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: normalizeEmail(user.email),
              password: stored.password,
            })

          if (!signInError && signInData.user?.email) {
            const nextUser = applyCloudProfile(
              {
                ...user,
                id: signInData.user.id,
                email: signInData.user.email,
              },
              profileFromAuthMetadata(
                signInData.user.user_metadata as Record<string, unknown>
              )
            )
            setUser(nextUser)
            persistAuthUser(nextUser)
            await pushOwnerProfile(nextUser)
            setSyncNotice(
              "Data sudah diunggah ke cloud. Di HP lain, masuk dengan email & kata sandi yang sama."
            )
            return { ok: true, user: nextUser }
          }

          if (signInError?.message?.toLowerCase().includes("email not confirmed")) {
            setSyncNotice(
              "Email belum dikonfirmasi. Buka kotak masuk / spam, klik link konfirmasi, lalu tekan “Simpan ke cloud” lagi."
            )
            return {
              ok: false,
              error:
                "Email belum dikonfirmasi. Cek inbox, klik link, lalu coba Simpan ke cloud lagi.",
            }
          }

          // Belum ada di Auth — daftarkan sekarang dengan password lokal.
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: normalizeEmail(user.email),
            password: stored.password,
            options: {
              data: profileToAuthMetadata(user),
              emailRedirectTo:
                typeof window !== "undefined" ? `${window.location.origin}/masuk` : undefined,
            },
          })

          if (signUpError) {
            return { ok: false, error: signUpError.message || "Gagal menghubungkan cloud." }
          }

          if (signUpData.session && signUpData.user) {
            const nextUser = { ...user, id: signUpData.user.id }
            setUser(nextUser)
            persistAuthUser(nextUser)
            await pushOwnerProfile(nextUser)
            setSyncNotice(
              "Akun cloud siap. Di HP lain, masuk dengan email & kata sandi yang sama."
            )
            return { ok: true, user: nextUser }
          }

          setSyncNotice(
            "Kami kirim email konfirmasi. Setelah diklik, kembali ke sini dan tekan “Simpan ke cloud” supaya data bisa dibuka di HP lain."
          )
          return {
            ok: false,
            error:
              "Konfirmasi email dulu (cek inbox/spam), lalu tekan Simpan ke cloud lagi.",
          }
        } catch {
          return { ok: false, error: "Gagal terhubung. Cek internet lalu coba lagi." }
        }
      },
      logout: async () => {
        if (supabase) await supabase.auth.signOut()
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      },
    }),
    [googleEnabled, ready, syncNotice, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider")
  return context
}
