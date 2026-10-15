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

type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string }

type AuthContextValue = {
  ready: boolean
  user: AuthUser | null
  login: (email: string, password: string) => AuthResult
  register: (input: {
    name: string
    email: string
    phone: string
    city: string
    studioName: string
    password: string
  }) => AuthResult
  continueWithGoogle: (choice: GoogleChoice) => AuthResult
  logout: () => void
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as AuthUser
          if (parsed?.email && parsed?.id) {
            setUser({
              ...parsed,
              provider: parsed.provider ?? "password",
            })
          }
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [ready, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      login: (email, password) => {
        const accounts = readAccounts()
        const account = accounts.find((item) => item.email === normalizeEmail(email))
        if (!account || account.password !== password) {
          return { ok: false, error: "Email atau kata sandi salah." }
        }
        const publicUser = toPublicUser(account)
        setUser(publicUser)
        return { ok: true, user: publicUser }
      },
      register: (input) => {
        const email = normalizeEmail(input.email)
        if (!input.name.trim() || !email || !input.password.trim()) {
          return { ok: false, error: "Nama, email, dan kata sandi wajib diisi." }
        }
        if (input.password.trim().length < 6) {
          return { ok: false, error: "Kata sandi minimal 6 karakter." }
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
      continueWithGoogle: (choice) => {
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
      logout: () => setUser(null),
    }),
    [ready, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider")
  return context
}
