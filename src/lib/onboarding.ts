export type BusinessFieldId =
  | "makeup"
  | "hair"
  | "dekor"
  | "baju"
  | "photo"
  | "video"
  | "content"
  | "other"

export type BusinessService = {
  id: string
  fieldId: BusinessFieldId
  name: string
  price: number
  durationHours: number
}

/** Numeric steps after account creation; `"done"` means onboarding finished. */
export type OnboardingStep = 2 | 3 | 4 | 5 | 6 | "done"

export const BUSINESS_FIELDS: {
  id: BusinessFieldId
  label: string
  emoji: string
  short: string
}[] = [
  { id: "makeup", label: "Make Up Artist", emoji: "💄", short: "MUA" },
  { id: "hair", label: "Hijab & Hair Stylist", emoji: "🧕", short: "Hijab & Hair" },
  { id: "dekor", label: "Decoration", emoji: "🌸", short: "Decoration" },
  { id: "baju", label: "Attire", emoji: "👗", short: "Attire" },
  { id: "photo", label: "Photography", emoji: "📸", short: "Photography" },
  { id: "video", label: "Videography", emoji: "🎥", short: "Videography" },
  {
    id: "content",
    label: "Event & Wedding Content Creator",
    emoji: "🎬",
    short: "Content Creator",
  },
  { id: "other", label: "Lainnya", emoji: "✨", short: "Lainnya" },
]

export function fieldById(id: BusinessFieldId) {
  return BUSINESS_FIELDS.find((field) => field.id === id)
}

export function needsOnboarding(
  user: { role?: string; onboardingStep?: OnboardingStep } | null | undefined
) {
  if (!user || user.role !== "owner") return false
  return typeof user.onboardingStep === "number"
}

export function normalizeOnboardingStep(value: unknown): OnboardingStep | undefined {
  if (value === "done") return "done"
  if (value === 2 || value === 3 || value === 4 || value === 5 || value === 6) {
    return value
  }
  return undefined
}

export function formatFieldsSummary(fieldIds: BusinessFieldId[] | undefined) {
  if (!fieldIds?.length) return "Belum dipilih"
  return fieldIds
    .map((id) => {
      const field = fieldById(id)
      return field ? `${field.emoji} ${field.short}` : id
    })
    .join(" · ")
}
