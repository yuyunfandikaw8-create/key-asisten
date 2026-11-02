/**
 * Konfigurasi paket & helper langganan Key Assistant.
 * Harga/periode diambil dari menu server `/admin` (localStorage).
 *
 * Pembayaran langganan = Owner → Key Assistant (terpisah dari bayar jasa klien → vendor).
 */

import {
  DEFAULT_ADMIN_SETTINGS,
  getLiveEnabledPayMethods,
  getLiveMainPlan,
  getLivePaymentDetails,
  getLiveServerNotice,
  getLiveSupportContact,
} from "@/lib/admin-settings"

/** Fallback default (nilai hidup pakai getMainPlan() / getTrialDays()). */
export const TRIAL_DAYS = DEFAULT_ADMIN_SETTINGS.plan.trialDays

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Snapshot default — UI runtime harus pakai getMainPlan(). */
export const MAIN_PLAN = DEFAULT_ADMIN_SETTINGS.plan

export function getMainPlan() {
  return getLiveMainPlan()
}

export function getTrialDays() {
  return getMainPlan().trialDays || TRIAL_DAYS
}

export function getServerNotice() {
  return getLiveServerNotice()
}

export function getPaymentDetails() {
  return getLivePaymentDetails()
}

export function getSupportContact() {
  return getLiveSupportContact()
}

/** True jika harga bulanan & tahunan sudah diisi di menu server. */
export function isPricingPublished() {
  const plan = getMainPlan()
  return (
    typeof plan.priceMonthly === "number" &&
    plan.priceMonthly > 0 &&
    typeof plan.priceYearly === "number" &&
    plan.priceYearly > 0
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
  /** Harga awal yang dicoret bila ada promo. */
  compareAtPrice: number | null
  periodLabel: string
  blurb: string
}

export function getPlanOptions(): SubscriptionPlanOption[] {
  const plan = getMainPlan()
  return [
    {
      id: "monthly",
      name: `${plan.name} Bulanan`,
      price: plan.priceMonthly,
      compareAtPrice: plan.compareAtMonthly,
      periodLabel: "/ bulan",
      blurb: plan.blurbMonthly,
    },
    {
      id: "yearly",
      name: `${plan.name} Tahunan`,
      price: plan.priceYearly,
      compareAtPrice: plan.compareAtYearly,
      periodLabel: "/ tahun",
      blurb: plan.blurbYearly,
    },
  ]
}

/** True jika Owner belum berlangganan aktif — boleh lihat harga promo. */
export function shouldShowOfferPricing(
  user: SubscriptionUserSlice | null | undefined
) {
  return !hasActiveSubscription(user)
}

export function getPromoSummaryLabel() {
  const plan = getMainPlan()
  if (!isPricingPublished()) return null
  const monthly = formatPlanPrice(plan.priceMonthly)
  const yearly = formatPlanPrice(plan.priceYearly)
  const monthlyWas =
    plan.compareAtMonthly && plan.compareAtMonthly > (plan.priceMonthly || 0)
      ? formatPlanPrice(plan.compareAtMonthly)
      : null
  const yearlyWas =
    plan.compareAtYearly && plan.compareAtYearly > (plan.priceYearly || 0)
      ? formatPlanPrice(plan.compareAtYearly)
      : null
  return {
    monthly,
    yearly,
    monthlyWas,
    yearlyWas,
    line: monthlyWas
      ? `Promo: ${monthly}/bln (dari ${monthlyWas}) · ${yearly}/thn${yearlyWas ? ` (dari ${yearlyWas})` : ""}`
      : `Langganan: ${monthly}/bln · ${yearly}/thn`,
  }
}

/** @deprecated pakai getPlanOptions() — tetap diekspor agar impor lama tidak pecah. */
export const SUBSCRIPTION_PLANS = getPlanOptions().map((option) => ({
  id: option.id,
  name: option.name,
  price: option.price ?? 0,
  period: option.periodLabel,
  blurb: option.blurb,
}))

const ALL_PAY_METHOD_LABELS: { id: SubscriptionPayMethod; label: string }[] = [
  { id: "qris", label: "QRIS" },
  { id: "va", label: "Virtual Account" },
  { id: "ewallet", label: "E-Wallet" },
  { id: "transfer", label: "Transfer manual" },
  { id: "card", label: "Kartu" },
]

export function getSubscriptionPayMethods(): {
  id: SubscriptionPayMethod
  label: string
}[] {
  const enabled = new Set(getLiveEnabledPayMethods())
  const filtered = ALL_PAY_METHOD_LABELS.filter((item) => enabled.has(item.id))
  return filtered.length ? filtered : ALL_PAY_METHOD_LABELS.filter((item) => item.id !== "card")
}

/** @deprecated pakai getSubscriptionPayMethods() */
export const SUBSCRIPTION_PAY_METHODS = ALL_PAY_METHOD_LABELS.filter(
  (item) => item.id !== "card"
)

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
  return new Date(started.getTime() + getTrialDays() * MS_PER_DAY)
}

/** Whole days remaining, floored. 0 on the last day before expiry; negative if expired. */
export function getTrialDaysRemaining(trialStartedAt: string | undefined | null) {
  const endsAt = getTrialEndsAt(trialStartedAt)
  if (!endsAt) return getTrialDays()
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
  const planName = getMainPlan().name
  if (status === "active" || status === "pending") {
    return user?.subscription?.planName || planName
  }
  return planName
}

export function formatTrialEndsAt(trialStartedAt: string | undefined | null) {
  return formatDateId(getTrialEndsAt(trialStartedAt))
}

/** Chip singkat di header studio. */
export function trialStatusLabel(trialStartedAt: string | undefined | null) {
  const days = getTrialDaysRemaining(trialStartedAt)
  if (!trialStartedAt) return `Trial ${getTrialDays()} hari`
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
