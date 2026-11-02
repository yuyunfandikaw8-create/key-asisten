/**
 * Konfigurasi paket & helper langganan Key Assistant.
 * Harga/periode hanya di sini — jangan hardcode di banyak halaman.
 *
 * Pembayaran langganan = Owner → Key Assistant (terpisah dari bayar jasa klien → vendor).
 */

export const TRIAL_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Satu paket utama; bulanan/tahunan = pilihan periode pembayaran.
 * Harga `null` = belum ditetapkan (jangan tampilkan angka palsu di UI).
 * Isi angka rupiah di sini saja bila harga sudah final.
 */
export const MAIN_PLAN = {
  id: "key-assistant",
  name: "Key Assistant",
  trialDays: TRIAL_DAYS,
  isActive: true,
  /** null sampai harga bulanan diputuskan. Contoh: 149_000 */
  priceMonthly: null as number | null,
  /** null sampai harga tahunan diputuskan. Contoh: 1_490_000 */
  priceYearly: null as number | null,
  blurbMonthly: "Fleksibel per bulan untuk mengelola bisnis di Key Assistant.",
  blurbYearly: "Bayar tahunan — hemat dibanding 12× bulanan.",
  featureConfig: {
    readAfterExpiry: true,
    writeRequiresActiveOrTrial: true,
  },
}

/** True jika harga bulanan & tahunan sudah diisi di MAIN_PLAN. */
export function isPricingPublished() {
  return (
    typeof MAIN_PLAN.priceMonthly === "number" &&
    MAIN_PLAN.priceMonthly > 0 &&
    typeof MAIN_PLAN.priceYearly === "number" &&
    MAIN_PLAN.priceYearly > 0
  )
}

export function formatPlanPrice(value: number | null | undefined) {
  if (typeof value !== "number" || value <= 0) return "Belum ditetapkan"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export type SubscriptionPeriod = "monthly" | "yearly"

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "pending"
  | "expired"
  | "cancelled"
  | "suspended"

export type SubscriptionPayMethod = "qris" | "va" | "ewallet" | "transfer" | "card"

export type SubscriptionPaymentRecord = {
  id: string
  invoiceNumber: string
  amount: number
  period: SubscriptionPeriod
  paymentMethod: SubscriptionPayMethod
  status: "pending" | "paid" | "failed" | "cancelled"
  createdAt: string
  paidAt?: string
  proofUrl?: string
  gatewayReference?: string
}

/** Pilihan periode di UI — harga diambil dari MAIN_PLAN. */
export type SubscriptionPlanOption = {
  id: SubscriptionPeriod
  name: string
  price: number | null
  periodLabel: string
  blurb: string
}

export function getPlanOptions(): SubscriptionPlanOption[] {
  return [
    {
      id: "monthly",
      name: `${MAIN_PLAN.name} Bulanan`,
      price: MAIN_PLAN.priceMonthly,
      periodLabel: "/ bulan",
      blurb: MAIN_PLAN.blurbMonthly,
    },
    {
      id: "yearly",
      name: `${MAIN_PLAN.name} Tahunan`,
      price: MAIN_PLAN.priceYearly,
      periodLabel: "/ tahun",
      blurb: MAIN_PLAN.blurbYearly,
    },
  ]
}

/** @deprecated pakai getPlanOptions() — tetap diekspor agar impor lama tidak pecah. */
export const SUBSCRIPTION_PLANS = getPlanOptions().map((option) => ({
  id: option.id,
  name: option.name,
  price: option.price ?? 0,
  period: option.periodLabel,
  blurb: option.blurb,
}))

export const SUBSCRIPTION_PAY_METHODS: {
  id: SubscriptionPayMethod
  label: string
}[] = [
  { id: "qris", label: "QRIS" },
  { id: "va", label: "Virtual Account" },
  { id: "ewallet", label: "E-Wallet" },
  { id: "transfer", label: "Transfer manual" },
]

export type SubscriptionUserSlice = {
  trialStartedAt?: string
  subscription?: {
    planId?: string
    planName?: string
    status?: string
    period?: SubscriptionPeriod
    paymentMethod?: SubscriptionPayMethod | string
    startedAt?: string
    endsAt?: string
    payments?: SubscriptionPaymentRecord[]
  } | null
}

export function nowIso() {
  return new Date().toISOString()
}

export function formatDateId(value: string | Date | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  })
}

export function hasActiveSubscription(user: SubscriptionUserSlice | null | undefined) {
  return user?.subscription?.status === "active"
}

export function hasPendingSubscription(user: SubscriptionUserSlice | null | undefined) {
  return user?.subscription?.status === "pending"
}

export function getTrialEndsAt(trialStartedAt: string | undefined | null) {
  if (!trialStartedAt) return null
  const started = new Date(trialStartedAt)
  if (Number.isNaN(started.getTime())) return null
  return new Date(started.getTime() + TRIAL_DAYS * MS_PER_DAY)
}

/** Whole days remaining, floored. 0 on the last day before expiry; negative if expired. */
export function getTrialDaysRemaining(trialStartedAt: string | undefined | null) {
  const endsAt = getTrialEndsAt(trialStartedAt)
  if (!endsAt) return TRIAL_DAYS
  return Math.ceil((endsAt.getTime() - Date.now()) / MS_PER_DAY)
}

export function isTrialExpired(trialStartedAt: string | undefined | null) {
  if (!trialStartedAt) return false
  return getTrialDaysRemaining(trialStartedAt) <= 0
}

/**
 * Status efektif untuk Owner.
 * `active` hanya setelah pembayaran diverifikasi — bukan sekadar redirect sukses.
 */
export function getSubscriptionStatus(
  user: SubscriptionUserSlice | null | undefined
): SubscriptionStatus {
  if (!user) return "expired"
  const raw = user.subscription?.status
  if (raw === "active") return "active"
  if (raw === "pending") return "pending"
  if (raw === "cancelled") return "cancelled"
  if (raw === "suspended") return "suspended"
  if (!user.trialStartedAt) return "trial"
  if (isTrialExpired(user.trialStartedAt)) return "expired"
  return "trial"
}

export function subscriptionStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case "trial":
      return "Trial"
    case "active":
      return "Aktif"
    case "pending":
      return "Menunggu verifikasi"
    case "expired":
      return "Berakhir"
    case "cancelled":
      return "Dibatalkan"
    case "suspended":
      return "Ditangguhkan"
  }
}

/**
 * Fitur operasional (buat/ubah booking, jadwal, invoice, layanan, transaksi).
 * Data lama tetap bisa dilihat setelah trial/langganan berakhir.
 */
export function canUseOperationalFeatures(
  user: SubscriptionUserSlice | null | undefined
) {
  const status = getSubscriptionStatus(user)
  if (status === "active") return true
  if (status === "trial") return true
  // Pending: tetap boleh operasi jika trial belum habis.
  if (status === "pending" && !isTrialExpired(user?.trialStartedAt)) return true
  return false
}

/**
 * Sebelumnya: redirect paksa ke /langganan.
 * Panduan: data tetap bisa diakses (read-only) — jangan kunci studio penuh.
 */
export function isStudioLocked(user: SubscriptionUserSlice | null | undefined) {
  return false
}

/** True jika Owner sudah lewat trial/langganan dan hanya boleh baca data lama. */
export function isStudioReadOnly(user: SubscriptionUserSlice | null | undefined) {
  return !canUseOperationalFeatures(user)
}

export function periodEndsAt(
  startedAt: string,
  period: SubscriptionPeriod
): string {
  const start = new Date(startedAt)
  const end = new Date(start)
  if (period === "yearly") end.setFullYear(end.getFullYear() + 1)
  else end.setMonth(end.getMonth() + 1)
  return end.toISOString()
}

export function currentPlanLabel(user: SubscriptionUserSlice | null | undefined) {
  const status = getSubscriptionStatus(user)
  if (status === "active" || status === "pending") {
    return user?.subscription?.planName || MAIN_PLAN.name
  }
  return MAIN_PLAN.name
}

export function formatTrialEndsAt(trialStartedAt: string | undefined | null) {
  return formatDateId(getTrialEndsAt(trialStartedAt))
}

/** Chip singkat di header studio. */
export function trialStatusLabel(trialStartedAt: string | undefined | null) {
  const days = getTrialDaysRemaining(trialStartedAt)
  if (!trialStartedAt) return `Trial ${TRIAL_DAYS} hari`
  if (days <= 0) return "Masa trial berakhir"
  if (days === 1) return "Trial berakhir hari ini"
  return `Sisa ${days} hari trial`
}

/**
 * Pengingat Owner saja — zona waktu Asia/Jakarta untuk label tanggal.
 * null = tidak perlu banner.
 */
export function getTrialReminderMessage(
  user: SubscriptionUserSlice | null | undefined
): string | null {
  if (hasActiveSubscription(user)) return null
  const status = getSubscriptionStatus(user)
  if (status === "pending") {
    return "Pembayaran langganan menunggu verifikasi. Status active hanya setelah pembayaran dikonfirmasi."
  }
  if (status === "expired" || status === "cancelled" || status === "suspended") {
    return "Masa trial telah berakhir. Pilih paket untuk melanjutkan penggunaan."
  }
  const days = getTrialDaysRemaining(user?.trialStartedAt)
  if (days <= 0) {
    return "Masa trial telah berakhir. Pilih paket untuk melanjutkan penggunaan."
  }
  if (days === 1) return "Trial berakhir hari ini"
  if (days <= 3) return `Trial kamu tersisa ${days} hari`
  if (days <= 7) return `Trial kamu tersisa ${days} hari`
  return null
}

export function getLanggananHeadline(
  user: SubscriptionUserSlice | null | undefined
) {
  const status = getSubscriptionStatus(user)
  if (status === "active") {
    return "Langganan aktif. Semua fitur pengelolaan bisnis terbuka."
  }
  if (status === "pending") {
    return "Pembayaran diterima dan menunggu verifikasi. Paket belum diaktifkan sampai dikonfirmasi."
  }
  if (status === "expired" || isTrialExpired(user?.trialStartedAt)) {
    return "Masa trial telah berakhir. Berlangganan untuk melanjutkan pengelolaan bisnis di Key Assistant."
  }
  const days = getTrialDaysRemaining(user?.trialStartedAt)
  return `Trial kamu tersisa ${Math.max(days, 0)} hari. Nikmati fitur Key Assistant selama masa percobaan.`
}

export function nextInvoiceNumber(existingCount = 0) {
  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")
  return `KA-${stamp}-${String(existingCount + 1).padStart(3, "0")}`
}
