import {
  needsOnboarding,
  normalizeOnboardingStep,
  type BusinessFieldId,
  type BusinessService,
  type CustomBusinessField,
  type OnboardingStep,
} from "@/lib/onboarding"

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
    roleChosen: true,
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
    roleChosen: true,
    onboardingStep: "done",
    businessFields: ["makeup", "hair"],
  },
  {
    id: "user-dina",
    name: "Dina Putri",
    email: "dina@riasaja.id",
    phone: "081298765432",
    city: "Bandung",
    studioName: "",
    password: "dina123",
    provider: "password",
    role: "client",
    roleChosen: true,
    onboardingStep: "done",
  },
]

/** Pilihan Gmail untuk demo picker (mirip layar pilih akun Google). */
export const GOOGLE_CHOICES: GoogleChoice[] = [
  {
    id: "gmail-laras",
    name: "Laras Ayu",
    email: "laras.ayu@gmail.com",
    city: "Bandung",
    studioName: "",
    phone: "081223334455",
    initial: "L",
    tone: "bg-[oklch(0.55_0.14_25)] text-white",
  },
  {
    id: "gmail-nadya",
    name: "Nadya Suro",
    email: "nadya.rias.sby@gmail.com",
    city: "Surabaya",
    studioName: "",
    phone: "081255566677",
    initial: "N",
    tone: "bg-[oklch(0.5_0.1_250)] text-white",
  },
  {
    id: "gmail-mira",
    name: "Mira Handayani",
    email: "mira.handayani@gmail.com",
    city: "Jakarta",
    studioName: "",
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
