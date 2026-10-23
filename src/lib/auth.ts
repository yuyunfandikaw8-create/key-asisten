import {
  needsOnboarding,
  normalizeOnboardingStep,
  type BusinessFieldId,
  type BusinessService,
  type OnboardingStep,
} from "@/lib/onboarding"

export type AuthProviderKind = "password" | "google"

/** Owner mengelola studio; klien mencari vendor / booking. */
export type AuthRole = "owner" | "client"

export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  studioName: string
  provider: AuthProviderKind
  role: AuthRole
  avatar?: string
  /** ISO timestamp when the 14-day trial began */
  trialStartedAt?: string
  /** Missing/`done` = selesai; angka = langkah onboarding aktif. */
  onboardingStep?: OnboardingStep
  businessEmail?: string
  instagram?: string
  address?: string
  logoDataUrl?: string
  businessFields?: BusinessFieldId[]
  services?: BusinessService[]
}

export function normalizeRole(role: unknown): AuthRole {
  return role === "client" ? "client" : "owner"
}

export function homePathForUser(user: AuthUser | null | undefined) {
  if (user?.role === "client") return "/klien"
  if (needsOnboarding(user)) return "/onboarding"
  return "/studio"
}

export type StoredAccount = AuthUser & {
  password: string
}

export type GoogleChoice = {
  id: string
  name: string
  email: string
  city: string
  studioName: string
  phone: string
  initial: string
  tone: string
}

export const AUTH_STORAGE_KEY = "riasaja.auth.v1"
export const ACCOUNTS_STORAGE_KEY = "riasaja.accounts.v1"

export const DEMO_ACCOUNTS: StoredAccount[] = [
  {
    id: "user-laras",
    name: "Key Partner",
    email: "laras@riasaja.id",
    phone: "081223334455",
    city: "Bandung",
    studioName: "Key Partner",
    password: "laras123",
    provider: "password",
    role: "owner",
    onboardingStep: "done",
    businessFields: ["makeup", "hair", "baju"],
  },
  {
    id: "user-suro",
    name: "Nadya Suro",
    email: "nadya@riasaja.id",
    phone: "081255566677",
    city: "Surabaya",
    studioName: "Nadya Rias Surabaya",
    password: "suro123",
    provider: "password",
    role: "owner",
    onboardingStep: "done",
    businessFields: ["makeup", "hair"],
  },
]

/** Pilihan Gmail untuk demo picker (mirip layar pilih akun Google). */
export const GOOGLE_CHOICES: GoogleChoice[] = [
  {
    id: "gmail-laras",
    name: "Key Partner",
    email: "key.partner@gmail.com",
    city: "Bandung",
    studioName: "Key Partner",
    phone: "081223334455",
    initial: "K",
    tone: "bg-[oklch(0.55_0.14_25)] text-white",
  },
  {
    id: "gmail-nadya",
    name: "Nadya Suro",
    email: "nadya.rias.sby@gmail.com",
    city: "Surabaya",
    studioName: "Nadya Rias Surabaya",
    phone: "081255566677",
    initial: "N",
    tone: "bg-[oklch(0.5_0.1_250)] text-white",
  },
  {
    id: "gmail-mira",
    name: "Mira Hairdo",
    email: "mira.hairdo@gmail.com",
    city: "Jakarta",
    studioName: "Mira Hair Studio",
    phone: "081288877766",
    initial: "M",
    tone: "bg-[oklch(0.52_0.1_160)] text-white",
  },
]

export function toPublicUser(account: StoredAccount): AuthUser {
  const { password: _password, ...user } = account
  return {
    ...user,
    role: normalizeRole(user.role),
    onboardingStep: normalizeOnboardingStep(user.onboardingStep),
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
