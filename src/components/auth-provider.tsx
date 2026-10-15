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
  return {
    id,
    email,
    name,
    city,
    studioName,
    phone,
    provider,
  }
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

    async function boot() {
      if (supabase) {
        try {
          const settings = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
            {
              headers: {
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              },
            }
          ).then((response) => response.json())
          if (active) setGoogleEnabled(Boolean(settings?.external?.google))
        } catch {
          if (active) setGoogleEnabled(false)
        }

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
        } else if (active) {
          try {
            const raw = localStorage.getItem(AUTH_STORAGE_KEY)
            if (raw) {
              const parsed = JSON.parse(raw) as AuthUser
              if (parsed?.email && parsed?.id) {
                setUser({ ...parsed, provider: parsed.provider ?? "password" })
              }
            }
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY)
          }
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
          } else {
            setUser((current) => (current?.provider === "password" && isDemoEmail(current.email) ? current : null))
          }
        })

        if (active) setReady(true)
        return () => {
          active = false
          listener.subscription.unsubscribe()
        }
      }

      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as AuthUser
          if (parsed?.email && parsed?.id) {
            setUser({ ...parsed, provider: parsed.provider ?? "password" })
          }
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
      if (active) setReady(true)
      return () => {
        active = false
      }
    }

    const cleanupPromise = boot()
    return () => {
      active = false
      void cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (user && !supabaseConfigured) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    }
    if (!user) localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [ready, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      supabaseReady: supabaseConfigured,
      googleEnabled,
      login: async (email, password) => {
        const normalized = normalizeEmail(email)

        if (supabase && !isDemoEmail(normalized)) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalized,
            password,
          })
          if (error) {
            return {
              ok: false,
              error:
                error.message.includes("Email not confirmed")
                  ? "Email belum dikonfirmasi. Cek kotak masuk Gmail/email kamu."
                  : "Email atau kata sandi salah.",
            }
          }
          if (!data.user?.email) return { ok: false, error: "Login Supabase gagal." }
          const publicUser = userFromMetadata(
            data.user.id,
            data.user.email,
            data.user.user_metadata as Record<string, unknown>,
            "password"
          )
          setUser(publicUser)
          return { ok: true, user: publicUser }
        }

        const accounts = readAccounts()
        const account = accounts.find((item) => item.email === normalized)
        if (!account || account.password !== password) {
          return { ok: false, error: "Email atau kata sandi salah." }
        }
        const publicUser = toPublicUser(account)
        setUser(publicUser)
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

        if (supabase && !isDemoEmail(email)) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password: input.password.trim(),
            options: {
              data: {
                name: input.name.trim(),
                phone: input.phone.trim(),
                city: input.city.trim() || "Bandung",
                studio_name: input.studioName.trim() || input.name.trim(),
              },
              emailRedirectTo:
                typeof window !== "undefined" ? `${window.location.origin}/masuk` : undefined,
            },
          })
          if (error) return { ok: false, error: error.message }

          if (data.session && data.user?.email) {
            const publicUser = userFromMetadata(
              data.user.id,
              data.user.email,
              data.user.user_metadata as Record<string, unknown>,
              "password"
            )
            setUser(publicUser)
            return { ok: true, user: publicUser }
          }

          return {
            ok: false,
            error:
              "Akun dibuat di Supabase. Cek email untuk konfirmasi, lalu masuk lagi.",
          }
        }

        const accounts = readAccounts()
        if (accounts.some((item) => item.email === email)) {
          return { ok: false, error: "Email ini sudah terdaftar di browser ini." }
        }
        const account: StoredAccount = {
          id: crypto.randomUUID(),
          name: input.name.trim(),
          email,
          phone: input.phone.trim(),
          city: input.city.trim() || "Bandung",
          studioName: input.studioName.trim() || input.name.trim(),
          password: input.password.trim(),
          provider: "password",
        }
        writeAccounts([...accounts, account])
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        return { ok: true, user: publicUser }
      },
      continueWithGoogle: async (choice) => {
        const email = normalizeEmail(choice.email)
        const accounts = readAccounts()
        const existing = accounts.find((item) => item.email === email)
        if (existing) {
          const publicUser = toPublicUser({
            ...existing,
            provider: "google",
            name: existing.name || choice.name,
          })
          setUser(publicUser)
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
        }
        writeAccounts([...accounts, account])
        const publicUser = toPublicUser(account)
        setUser(publicUser)
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
              "Provider Google belum diaktifkan di Supabase Authentication. Pakai pilihan Gmail demo dulu, atau nyalakan Google di dashboard.",
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
