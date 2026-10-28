import {
  needsOnboarding,
  normalizeOnboardingStep,
  type BusinessFieldId,
  type BusinessService,
  type CustomBusinessField,
  type OnboardingStep,
} from "@/lib/onboarding"
import { demoPortfolioItems, type PortfolioItem } from "@/lib/portfolio"

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

export const AUTH_STORAGE_KEY = "riasaja.auth.v1"
export const ACCOUNTS_STORAGE_KEY = "riasaja.accounts.v1"

/** Akun uji lokal (@riasaja.id) — untuk ubah/perbaiki fitur di app tanpa Supabase. */
export const DEMO_ACCOUNTS: StoredAccount[] = [
  {
    id: "user-owner",
    name: "Owner Uji",
    email: "owner@riasaja.id",
    phone: "081211112222",
    city: "Surabaya",
    studioName: "Laras Makeup",
    password: "owner123",
    provider: "password",
    role: "owner",
    roleChosen: true,
    onboardingStep: "done",
    businessFields: ["makeup", "hair"],
    bio: "Makeup untuk wedding, engagement, wisuda, dan acara spesial.",
    rating: 4.9,
    publicSlug: "laras",
    portfolio: demoPortfolioItems(),
    services: [
      {
        id: "owner-svc-pengantin",
        fieldId: "makeup",
        name: "Makeup Pengantin",
        price: 2_500_000,
        durationHours: 8,
        details: "Soft glam untuk akad & resepsi",
      },
      {
        id: "owner-svc-akad",
        fieldId: "makeup",
        name: "Makeup Akad",
        price: 1_500_000,
        durationHours: 4,
        details: "Look natural untuk akad",
      },
      {
        id: "owner-svc-wisuda",
        fieldId: "makeup",
        name: "Makeup Wisuda",
        price: 500_000,
        durationHours: 2,
        details: "Natural untuk wisuda & foto",
      },
    ],
  },
  {
    id: "user-klien",
    name: "Klien Uji",
    email: "klien@riasaja.id",
    phone: "081233334444",
    city: "Surabaya",
    studioName: "",
    password: "klien123",
    provider: "password",
    role: "client",
    roleChosen: true,
    onboardingStep: "done",
  },
]

/** Pintasan login di halaman Masuk — Owner & Klien untuk uji fitur. */
export const QUICK_TEST_LOGINS: {
  role: AuthRole
  label: string
  email: string
  password: string
  hint: string
}[] = [
  {
    role: "owner",
    label: "Owner",
    email: "owner@riasaja.id",
    password: "owner123",
    hint: "Portofolio, profil publik, booking",
  },
  {
    role: "client",
    label: "Klien",
    email: "klien@riasaja.id",
    password: "klien123",
    hint: "Cari vendor & lihat portofolio",
  },
]

/** Pilihan akun demo di picker Google — hanya Owner & Klien uji. */
export const GOOGLE_CHOICES: GoogleChoice[] = [
  {
    id: "gmail-owner",
    name: "Owner Uji",
    email: "owner@riasaja.id",
    city: "Surabaya",
    studioName: "Laras Makeup",
    phone: "081211112222",
    initial: "O",
    tone: "bg-[oklch(0.55_0.14_25)] text-white",
  },
  {
    id: "gmail-klien",
    name: "Klien Uji",
    email: "klien@riasaja.id",
    city: "Surabaya",
    studioName: "",
    phone: "081233334444",
    initial: "K",
    tone: "bg-[oklch(0.5_0.1_250)] text-white",
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
