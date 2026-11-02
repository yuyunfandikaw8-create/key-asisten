import {
  needsOnboarding,
  normalizeOnboardingStep,
  type BusinessFieldId,
  type BusinessService,
  type CustomBusinessField,
  type OnboardingStep,
} from "@/lib/onboarding"
import type { PortfolioItem } from "@/lib/portfolio"

export type AuthProviderKind = "password" | "google"

/** Owner mengelola studio; klien mencari vendor / booking. */
export type AuthRole = "owner" | "client"

export type PaymentMethodId = "transfer" | "qris" | "ewallet" | "cash"

export type PaymentSettings = {
  methods: PaymentMethodId[]
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  /** Data URL gambar QRIS. */
  qrisDataUrl?: string
  ewalletName?: string
  ewalletNumber?: string
}

/** Default kosong — pengguna yang mencentang sendiri, bukan dicentang otomatis. */
export const DEFAULT_PAYMENT_METHODS: PaymentMethodId[] = []

export const PAYMENT_METHOD_OPTIONS: {
  id: PaymentMethodId
  label: string
}[] = [
  { id: "transfer", label: "Transfer Bank" },
  { id: "qris", label: "QRIS" },
  { id: "ewallet", label: "E-Wallet" },
  { id: "cash", label: "Tunai" },
]

export function normalizePaymentSettings(
  value: PaymentSettings | undefined | null
): PaymentSettings {
  const methods = Array.isArray(value?.methods)
    ? value!.methods.filter((id): id is PaymentMethodId =>
        PAYMENT_METHOD_OPTIONS.some((option) => option.id === id)
      )
    : [...DEFAULT_PAYMENT_METHODS]
  return {
    methods,
    bankName: value?.bankName?.trim() || "",
    accountNumber: value?.accountNumber?.trim() || "",
    accountHolder: value?.accountHolder?.trim() || "",
    qrisDataUrl: value?.qrisDataUrl,
    ewalletName: value?.ewalletName?.trim() || "",
    ewalletNumber: value?.ewalletNumber?.trim() || "",
  }
}

/** Metode yang tampil di invoice: pilihan booking ∩ metode aktif owner. */
export function resolveInvoicePaymentMethods(
  selected: PaymentMethodId[] | undefined,
  available: PaymentMethodId[]
): PaymentMethodId[] {
  const allowed = available.filter((id) =>
    PAYMENT_METHOD_OPTIONS.some((option) => option.id === id)
  )
  if (!allowed.length) return []
  if (!selected?.length) return allowed
  const picked = selected.filter((id) => allowed.includes(id))
  return picked.length ? picked : allowed
}

export function paymentMethodLabel(id: PaymentMethodId) {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.id === id)?.label ?? id
}

export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  studioName: string
  provider: AuthProviderKind
  role: AuthRole
  /**
   * false = baru login Google, belum memilih Owner/Klien.
   * undefined/true = sudah punya peran (akun lama atau daftar email).
   */
  roleChosen?: boolean
  avatar?: string
  /** ISO timestamp when the 14-day trial began */
  trialStartedAt?: string
  /** Missing/`done` = selesai; angka = langkah onboarding aktif. */
  onboardingStep?: OnboardingStep
  businessEmail?: string
  instagram?: string
  address?: string
  logoDataUrl?: string
  /** Deskripsi singkat bisnis untuk profil publik. */
  bio?: string
  /** Rating tampilan publik (opsional; default dari contoh/demo). */
  rating?: number
  /** Portofolio hasil pekerjaan — Owner atur tampil/sembunyi per item. */
  portfolio?: PortfolioItem[]
  /** Slug profil publik `/p/[slug]`. Kosong = diturunkan dari nama bisnis. */
  publicSlug?: string
  businessFields?: BusinessFieldId[]
  /** Bidang diketik manual (di luar daftar bawaan). */
  customBusinessFields?: CustomBusinessField[]
  services?: BusinessService[]
  paymentSettings?: PaymentSettings
  /** Langganan Key Assistant setelah trial. */
  subscription?: {
    planId: string
    planName: string
    status: "active"
    paymentMethod: "qris" | "va" | "ewallet" | "card"
    startedAt: string
  }
}

export function normalizeRole(role: unknown): AuthRole {
  return role === "client" ? "client" : "owner"
}

export function homePathForUser(user: AuthUser | null | undefined) {
  // Pilihan peran ditampilkan di /daftar (satu alur, tanpa loncat halaman).
  if (user && user.roleChosen === false) return "/daftar"
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

/** v2: hapus sesi/akun lokal lama agar pengguna daftar Owner & Klien sendiri. */
export const AUTH_STORAGE_KEY = "riasaja.auth.v2"
export const ACCOUNTS_STORAGE_KEY = "riasaja.accounts.v2"

/** Tidak ada akun uji bawaan — daftar lewat /daftar atau Google. */
export const DEMO_ACCOUNTS: StoredAccount[] = []

/** Pintasan login uji — kosong sampai dibutuhkan lagi untuk pengembangan. */
export const QUICK_TEST_LOGINS: {
  role: AuthRole
  label: string
  email: string
  password: string
  hint: string
}[] = []

/** Pilihan akun demo di picker Google — kosong; pengguna memasukkan email sendiri. */
export const GOOGLE_CHOICES: GoogleChoice[] = []

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
