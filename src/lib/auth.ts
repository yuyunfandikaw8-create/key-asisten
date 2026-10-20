export type AuthProviderKind = "password" | "google"

export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  studioName: string
  provider: AuthProviderKind
  avatar?: string
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
    name: "Laras Ayu",
    email: "laras@riasaja.id",
    phone: "081223334455",
    city: "Bandung",
    studioName: "Key Partner",
    password: "laras123",
    provider: "password",
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
  },
]

/** Pilihan Gmail untuk demo picker (mirip layar pilih akun Google). */
export const GOOGLE_CHOICES: GoogleChoice[] = [
  {
    id: "gmail-laras",
    name: "Laras Ayu",
    email: "laras.bridal@gmail.com",
    city: "Bandung",
    studioName: "Key Partner",
    phone: "081223334455",
    initial: "L",
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
  return user
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
