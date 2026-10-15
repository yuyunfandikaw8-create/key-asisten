export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  studioName: string
}

export type StoredAccount = AuthUser & {
  password: string
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
    studioName: "Laras Bridal",
    password: "laras123",
  },
  {
    id: "user-suro",
    name: "Nadya Suro",
    email: "nadya@riasaja.id",
    phone: "081255566677",
    city: "Surabaya",
    studioName: "Nadya Rias Surabaya",
    password: "suro123",
  },
]

export function toPublicUser(account: StoredAccount): AuthUser {
  const { password: _password, ...user } = account
  return user
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
