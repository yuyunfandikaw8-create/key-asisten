export const TRIAL_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function nowIso() {
  return new Date().toISOString()
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
