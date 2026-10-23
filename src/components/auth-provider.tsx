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
  toPublicUser,
  type AuthUser,
  type GoogleChoice,
  type StoredAccount,
} from "@/lib/auth"
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
    phone: string
    city: string
    studioName: string
    password: string
  }) => Promise<AuthResult>
  continueWithGoogle: (choice: GoogleChoice) => Promise<AuthResult>
  startGoogleOAuth: (nextPath?: string) => Promise<AuthResult>
  /** Owner-only: persist studio wilayah on the account profile. */
  updateOwnerCity: (city: string) => Promise<void>
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
  const city = typeof metadata?.city === "string" && metadata.city ? metadata.city : "Bandung"
  const studioName =
    (typeof metadata?.studio_name === "string" && metadata.studio_name) ||
    (typeof metadata?.studioName === "string" && metadata.studioName) ||
    name
  const phone = typeof metadata?.phone === "string" ? metadata.phone : ""
  const trialStartedAt =
    typeof metadata?.trial_started_at === "string" && metadata.trial_started_at
      ? metadata.trial_started_at
      : nowIso()
  return {
    id,
    email,
    name,
    city,
    studioName,
    phone,
    provider,
    trialStartedAt,
  }
}

function withTrial(user: AuthUser): AuthUser {
  if (user.trialStartedAt) return user
  return { ...user, trialStartedAt: nowIso() }
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
          const next = withTrial({
            ...parsed,
            provider: parsed.provider ?? "password",
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
          setUser(
            userFromMetadata(
              sessionUser.id,
              sessionUser.email,
              sessionUser.user_metadata as Record<string, unknown>,
              sessionUser.app_metadata?.provider === "google" ? "google" : "password"
            )
          )
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      } catch {
        // Tetap pakai sesi lokal.
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return
        const next = session?.user
        if (next?.email) {
          setUser(
            userFromMetadata(
              next.id,
              next.email,
              next.user_metadata as Record<string, unknown>,
              next.app_metadata?.provider === "google" ? "google" : "password"
            )
          )
          localStorage.removeItem(AUTH_STORAGE_KEY)
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
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
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
          city: "Bandung",
          studioName: name,
          password: pass,
          provider: "password",
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
        if (input.password.trim().length < 6) {
          return { ok: false, error: "Kata sandi minimal 6 karakter." }
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
          phone: input.phone.trim(),
          city: input.city.trim() || "Bandung",
          studioName: input.studioName.trim() || input.name.trim(),
          password: input.password.trim(),
          provider: "password",
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
                phone: input.phone.trim(),
                city: input.city.trim() || "Bandung",
                studio_name: input.studioName.trim() || input.name.trim(),
                trial_started_at: trialStartedAt,
              },
              emailRedirectTo:
                typeof window !== "undefined" ? `${window.location.origin}/masuk` : undefined,
            },
          })
        }

        return { ok: true, user: publicUser }
      },
      continueWithGoogle: async (choice) => {
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
            })
          )
          if (!existing.trialStartedAt && publicUser.trialStartedAt) {
            persistAccountTrial(publicUser.email, publicUser.trialStartedAt)
          }
          setUser(publicUser)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(publicUser))
          return { ok: true, user: publicUser }
        }
        const account: StoredAccount = {
          id: crypto.randomUUID(),
          name: choice.name,
          email,
          phone: choice.phone,
          city: choice.city,
          studioName: choice.studioName,
          password: `google:${email}`,
          provider: "google",
          avatar: choice.initial,
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
