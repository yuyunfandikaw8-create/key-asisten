export const TRIAL_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type SubscriptionPlan = {
  id: string
  name: string
  price: number
  period: string
  blurb: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "bulanan",
    name: "Bulanan",
    price: 149_000,
    period: "/ bulan",
    blurb: "Fleksibel, bisa dibatalkan kapan saja.",
  },
  {
    id: "tahunan",
    name: "Tahunan",
    price: 1_490_000,
    period: "/ tahun",
    blurb: "Hemat 2 bulan — cocok untuk studio yang sudah jalan.",
  },
]

export type SubscriptionPayMethod = "qris" | "va" | "ewallet" | "card"

export const SUBSCRIPTION_PAY_METHODS: {
  id: SubscriptionPayMethod
  label: string
}[] = [
  { id: "qris", label: "QRIS" },
  { id: "va", label: "Virtual Account" },
  { id: "ewallet", label: "E-Wallet" },
  { id: "card", label: "Kartu" },
]

export function nowIso() {
  return new Date().toISOString()
}

export function hasActiveSubscription(
  user: { subscription?: { status?: string } | null } | null | undefined
) {
  return user?.subscription?.status === "active"
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
  return getTrialDaysRemaining(trialStartedAt) <= 0
}

/** Studio terkunci bila trial habis dan belum berlangganan. */
export function isStudioLocked(
  user:
    | {
        trialStartedAt?: string
        subscription?: { status?: string } | null
      }
    | null
    | undefined
) {
  if (!user) return false
  if (hasActiveSubscription(user)) return false
  return isTrialExpired(user.trialStartedAt)
}

export function currentPlanLabel(
  user:
    | {
        trialStartedAt?: string
        subscription?: { planName?: string; status?: string } | null
      }
    | null
    | undefined
) {
  if (hasActiveSubscription(user)) {
    return user?.subscription?.planName || "Berlangganan"
  }
  return "Trial"
}

export function formatTrialEndsAt(trialStartedAt: string | undefined | null) {
  const endsAt = getTrialEndsAt(trialStartedAt)
  if (!endsAt) return null
  return endsAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function trialStatusLabel(trialStartedAt: string | undefined | null) {
  const days = getTrialDaysRemaining(trialStartedAt)
  if (days <= 0) return "Masa trial berakhir"
  if (days === 1) return "Sisa 1 hari trial"
  return `Sisa ${days} hari trial`
}
