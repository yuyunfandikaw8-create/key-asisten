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
import { supabase, supabaseConfigured } from "@/lib/supabase"
import { nowIso } from "@/lib/trial"

type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string }

type AuthContextValue = {
  ready: boolean
  user: AuthUser | null
  supabaseReady: boolean
  googleEnabled: boolean
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
  const name =
    (typeof metadata?.name === "string" && metadata.name) ||
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    email.split("@")[0]
  const city = typeof metadata?.city === "string" && metadata.city ? metadata.city : ""
  const studioName =
    (typeof metadata?.studio_name === "string" && metadata.studio_name) ||
    (typeof metadata?.studioName === "string" && metadata.studioName) ||
    ""
  const phone = typeof metadata?.phone === "string" ? metadata.phone : ""
  const role = normalizeRole(metadata?.role)
  const trialStartedAt =
    typeof metadata?.trial_started_at === "string" && metadata.trial_started_at
      ? metadata.trial_started_at
      : nowIso()
  const onboardingStep = normalizeOnboardingStep(metadata?.onboarding_step)
  const businessEmail =
    typeof metadata?.business_email === "string" ? metadata.business_email : undefined
  const instagram = typeof metadata?.instagram === "string" ? metadata.instagram : undefined
  const address = typeof metadata?.address === "string" ? metadata.address : undefined
  const businessFields = Array.isArray(metadata?.business_fields)
    ? (metadata.business_fields as BusinessFieldId[])
    : undefined
  const services = Array.isArray(metadata?.services)
    ? (metadata.services as BusinessService[])
    : undefined
  const paymentSettings =
    metadata?.payment_settings && typeof metadata.payment_settings === "object"
      ? normalizePaymentSettings(metadata.payment_settings as PaymentSettings)
      : undefined
  const subscription =
    metadata?.subscription && typeof metadata.subscription === "object"
      ? (metadata.subscription as AuthUser["subscription"])
      : undefined
  return {
    id,
    email,
    name,
    city,
    studioName,
    phone,
    provider,
    role,
    trialStartedAt,
    onboardingStep,
    businessEmail,
    instagram,
    address,
    businessFields,
    services,
    paymentSettings,
    subscription,
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

      try {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user
        if (active && sessionUser?.email) {
          const merged = withPendingRegisterRole(
            resolveSessionUser(
              sessionUser.id,
              sessionUser.email,
              sessionUser.user_metadata as Record<string, unknown>,
              sessionUser.app_metadata?.provider === "google" ? "google" : "password"
            )
          )
          setUser(merged)
          persistAuthUser(merged)
        }
      } catch {
        // Tetap pakai sesi lokal.
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return
        const next = session?.user
        if (next?.email) {
          const merged = withPendingRegisterRole(
            resolveSessionUser(
              next.id,
              next.email,
              next.user_metadata as Record<string, unknown>,
              next.app_metadata?.provider === "google" ? "google" : "password"
            )
          )
          setUser(merged)
          persistAuthUser(merged)
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
        if (localAccount) {
          if (localAccount.password !== pass) {
            return { ok: false, error: "Kata sandi salah." }
          }
          const publicUser = withTrial(toPublicUser(localAccount))
          if (!localAccount.trialStartedAt && publicUser.trialStartedAt) {
            persistAccountTrial(publicUser.email, publicUser.trialStartedAt)
          }
          setUser(publicUser)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(publicUser))
          return { ok: true, user: publicUser }
        }

        if (supabase && !isDemoEmail(normalized)) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: normalized,
              password: pass,
            })
            if (!error && data.user?.email) {
              const publicUser = withTrial(
                userFromMetadata(
                  data.user.id,
                  data.user.email,
                  data.user.user_metadata as Record<string, unknown>,
                  "password"
                )
              )
              setUser(publicUser)
              return { ok: true, user: publicUser }
            }
          } catch {
            // Lanjut ke pembuatan akun lokal di bawah.
          }
        }

        // Akun baru: buat sesi lokal langsung agar bisa masuk tanpa daftar ulang.
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
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(publicUser))
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
        const account: StoredAccount = {
          id: crypto.randomUUID(),
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

        // Langsung aktif di browser supaya tidak menunggu konfirmasi email Supabase.
        writeAccounts([...accounts, account])
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(publicUser))

        if (supabase && !isDemoEmail(email)) {
          void supabase.auth.signUp({
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
        }
        return nextUser
      },
      logout: async () => {
        if (supabase) await supabase.auth.signOut()
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      },
    }),
    [googleEnabled, ready, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider")
  return context
}
