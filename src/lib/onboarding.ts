export type BuiltInBusinessFieldId =
  | "makeup"
  | "hair"
  | "dekor"
  | "baju"
  | "photo"
  | "video"
  | "content"
  | "other"

/** Built-in id atau id kustom `custom-…` dari isian manual owner. */
export type BusinessFieldId = BuiltInBusinessFieldId | string

export type BusinessFieldMeta = {
  id: string
  label: string
  emoji: string
  short: string
}

/** Bidang yang diketik manual owner — ikut tersimpan di akun. */
export type CustomBusinessField = BusinessFieldMeta

export type BusinessService = {
  id: string
  fieldId: BusinessFieldId
  name: string
  price: number
  durationHours: number
  /** Rincian singkat paket — tampil di link booking klien. */
  details?: string
}

/** Numeric steps after account creation; `"done"` means onboarding finished. */
export type OnboardingStep = 2 | 3 | 4 | 5 | 6 | "done"

export const BUSINESS_FIELDS: BusinessFieldMeta[] = [
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

export function isCustomFieldId(id: string) {
  return id.startsWith("custom-")
}

export function createCustomBusinessField(label: string): CustomBusinessField {
  const trimmed = label.trim().replace(/\s+/g, " ")
  const slug =
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "bidang"
  const short = trimmed.length > 24 ? `${trimmed.slice(0, 22)}…` : trimmed
  return {
    id: `custom-${slug}-${Math.random().toString(36).slice(2, 7)}`,
    label: trimmed,
    emoji: "✨",
    short,
  }
}

export function fieldById(
  id: string | undefined | null,
  custom: CustomBusinessField[] | undefined | null = []
): BusinessFieldMeta | undefined {
  if (!id) return undefined
  return (
    BUSINESS_FIELDS.find((field) => field.id === id) ||
    custom?.find((field) => field.id === id) ||
    (isCustomFieldId(id)
      ? { id, label: id.replace(/^custom-/, ""), emoji: "✨", short: id }
      : undefined)
  )
}

/** Flag kecil terpisah — tidak ikut gagal karena kuota logo di auth storage. */
export const ONBOARDING_DONE_PREFIX = "key-assistant.onboarding-done.v1:"

export function onboardingDoneStorageKey(email: string) {
  return `${ONBOARDING_DONE_PREFIX}${email.trim().toLowerCase()}`
}

export function markOnboardingDone(email: string | undefined | null) {
  if (!email || typeof window === "undefined") return
  try {
    localStorage.setItem(onboardingDoneStorageKey(email), "1")
  } catch {
    // ignore
  }
}

export function clearOnboardingDone(email: string | undefined | null) {
  if (!email || typeof window === "undefined") return
  try {
    localStorage.removeItem(onboardingDoneStorageKey(email))
  } catch {
    // ignore
  }
}

export function isOnboardingMarkedDone(email: string | undefined | null) {
  if (!email || typeof window === "undefined") return false
  try {
    return localStorage.getItem(onboardingDoneStorageKey(email)) === "1"
  } catch {
    return false
  }
}

export function needsOnboarding(
  user: { email?: string; role?: string; onboardingStep?: OnboardingStep } | null | undefined
) {
  if (!user || user.role !== "owner") return false
  if (user.onboardingStep === "done") return false
  if (isOnboardingMarkedDone(user.email)) return false
  return typeof user.onboardingStep === "number"
}

export function normalizeOnboardingStep(value: unknown): OnboardingStep | undefined {
  if (value === "done") return "done"
  // JSON / Supabase kadang mengirim angka sebagai string.
  if (value === 2 || value === "2") return 2
  if (value === 3 || value === "3") return 3
  if (value === 4 || value === "4") return 4
  if (value === 5 || value === "5") return 5
  if (value === 6 || value === "6") return 6
  return undefined
}

/** Jangan mundur dari "done" ke step angka saat hydrate remote. */
export function preferOnboardingStep(
  local: OnboardingStep | undefined,
  remote: OnboardingStep | undefined
): OnboardingStep | undefined {
  if (local === "done" || remote === "done") return "done"
  const localNum = typeof local === "number" ? local : 0
  const remoteNum = typeof remote === "number" ? remote : 0
  const max = Math.max(localNum, remoteNum)
  return max > 0 ? (max as OnboardingStep) : undefined
}

export function formatFieldsSummary(
  fieldIds: BusinessFieldId[] | undefined,
  custom?: CustomBusinessField[] | undefined
) {
  if (!fieldIds?.length) return "Belum dipilih"
  return fieldIds
    .map((id) => {
      const field = fieldById(id, custom)
      return field ? `${field.emoji} ${field.short}` : id
    })
    .join(" · ")
}

export type ServicePreset = {
  name: string
}

/** Pilihan nama layanan siap pakai — harga & waktu diisi manual owner. */
export const SERVICE_PRESETS: Record<BuiltInBusinessFieldId, ServicePreset[]> = {
  makeup: [
    { name: "Wedding Makeup (Akad + Resepsi)" },
    { name: "Wedding Makeup Akad" },
    { name: "Wedding Makeup Resepsi" },
    { name: "Makeup Pengantin Adat" },
    { name: "Paes / Makeup Tradisional" },
    { name: "Engagement / Lamaran Makeup" },
    { name: "Prewedding Makeup" },
    { name: "Makeup Wisuda" },
    { name: "Makeup Party / Kondangan" },
    { name: "Makeup Bridesmaid" },
    { name: "Makeup Ibu Pengantin" },
    { name: "Makeup Family (per orang)" },
    { name: "Retouch Makeup" },
    { name: "Makeup Trial / Fitting" },
    { name: "Home Service Makeup" },
  ],
  hair: [
    { name: "Hijab & Hair Wedding" },
    { name: "Hijab Pengantin Akad" },
    { name: "Hijab Pengantin Resepsi" },
    { name: "Hair Do Pengantin" },
    { name: "Hair Extension / Sanggul" },
    { name: "Hijab Wisuda" },
    { name: "Hair Styling Party" },
    { name: "Hijab Bridesmaid" },
    { name: "Hijab Ibu Pengantin" },
    { name: "Kerudung Segi Empat Styling" },
    { name: "Hair & Hijab Trial" },
    { name: "Retouch Hijab / Hair" },
  ],
  dekor: [
    { name: "Dekorasi Pelaminan Gedung" },
    { name: "Dekorasi Pelaminan Rumah" },
    { name: "Dekorasi Akad Outdoor" },
    { name: "Dekorasi Lamaran / Engagement" },
    { name: "Dekorasi Siraman / Midodareni" },
    { name: "Gapura & Jalan Pengantin" },
    { name: "Backdrop Photo Booth" },
    { name: "Meja Penerima Tamu" },
    { name: "Dekorasi Pelaminan Adat" },
    { name: "Lighting Dekorasi" },
    { name: "Fresh Flower Arrangement" },
    { name: "Dekorasi Mini / Intimate" },
  ],
  baju: [
    { name: "Sewa Gaun Pengantin" },
    { name: "Sewa Kebaya Pengantin" },
    { name: "Sewa Beskap / Jas Pengantin" },
    { name: "Sewa Gaun Resepsi" },
    { name: "Sewa Kebaya Wisuda" },
    { name: "Sewa Gaun Engagement" },
    { name: "Sewa Bridesmaid Dress" },
    { name: "Sewa Baju Adat Lengkap" },
    { name: "Sewa Aksesoris Pengantin" },
    { name: "Fitting & Alteration" },
    { name: "Paket Gaun + Kebaya" },
    { name: "Sewa Outer / Blazer Event" },
  ],
  photo: [
    { name: "Wedding Photography Full Day" },
    { name: "Wedding Photography Half Day" },
    { name: "Akad Photography" },
    { name: "Resepsi Photography" },
    { name: "Prewedding Photography" },
    { name: "Engagement Photography" },
    { name: "Wisuda Photography" },
    { name: "Siraman / Adat Photography" },
    { name: "Family Portrait" },
    { name: "Foto Produk / Lookbook" },
    { name: "Same Day Edit Photo" },
    { name: "Album & Cetak Foto" },
  ],
  video: [
    { name: "Wedding Videography Full Day" },
    { name: "Wedding Videography Half Day" },
    { name: "Cinematic Wedding Film" },
    { name: "Akad Videography" },
    { name: "Resepsi Videography" },
    { name: "Prewedding Video" },
    { name: "Engagement Video" },
    { name: "Same Day Edit Video" },
    { name: "Highlight Reel 3–5 menit" },
    { name: "Dokumentasi Drone" },
    { name: "Teaser Wedding 1 menit" },
    { name: "Livestream Acara" },
  ],
  content: [
    { name: "Wedding Content Creator Full Day" },
    { name: "Wedding Content Creator Half Day" },
    { name: "Reels & TikTok Documentation" },
    { name: "Behind The Scene Content" },
    { name: "Engagement Content Pack" },
    { name: "Prewedding Content Pack" },
    { name: "Same Day Story Upload" },
    { name: "Brand / Vendor Content Day" },
    { name: "Event Highlight Reels" },
    { name: "Photo Dump + Caption Pack" },
  ],
  other: [
    { name: "Wedding Organizer Full Service" },
    { name: "Wedding Organizer Partial" },
    { name: "MC Akad & Resepsi" },
    { name: "Entertainment / Band" },
    { name: "Sound System" },
    { name: "Catering Paket (estimasi)" },
    { name: "Undangan Digital" },
    { name: "Souvenir & Gift" },
    { name: "Transportasi Pengantin" },
    { name: "Konsultan / Planning Session" },
  ],
}

export function presetsForField(fieldId: BusinessFieldId) {
  if (isCustomFieldId(fieldId)) return []
  return SERVICE_PRESETS[fieldId as BuiltInBusinessFieldId] ?? []
}

export function filterServicePresets(fieldId: BusinessFieldId, query: string) {
  const needle = query.trim().toLowerCase()
  const presets = presetsForField(fieldId)
  if (!needle) return presets
  return presets.filter((preset) => preset.name.toLowerCase().includes(needle))
}
