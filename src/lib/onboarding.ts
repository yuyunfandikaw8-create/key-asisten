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

export type ServicePreset = {
  name: string
  price: number
  durationHours: number
}

/** Pilihan layanan siap pakai per bidang — owner tetap bisa menambah teks bebas. */
export const SERVICE_PRESETS: Record<BusinessFieldId, ServicePreset[]> = {
  makeup: [
    { name: "Wedding Makeup (Akad + Resepsi)", price: 3_500_000, durationHours: 6 },
    { name: "Wedding Makeup Akad", price: 2_000_000, durationHours: 3 },
    { name: "Wedding Makeup Resepsi", price: 2_500_000, durationHours: 4 },
    { name: "Makeup Pengantin Adat", price: 4_000_000, durationHours: 5 },
    { name: "Paes / Makeup Tradisional", price: 3_800_000, durationHours: 5 },
    { name: "Engagement / Lamaran Makeup", price: 1_500_000, durationHours: 3 },
    { name: "Prewedding Makeup", price: 1_200_000, durationHours: 3 },
    { name: "Makeup Wisuda", price: 850_000, durationHours: 2 },
    { name: "Makeup Party / Kondangan", price: 750_000, durationHours: 2 },
    { name: "Makeup Bridesmaid", price: 650_000, durationHours: 2 },
    { name: "Makeup Ibu Pengantin", price: 700_000, durationHours: 2 },
    { name: "Makeup Family (per orang)", price: 550_000, durationHours: 1.5 },
    { name: "Retouch Makeup", price: 400_000, durationHours: 1 },
    { name: "Makeup Trial / Fitting", price: 500_000, durationHours: 2 },
    { name: "Home Service Makeup", price: 900_000, durationHours: 2.5 },
  ],
  hair: [
    { name: "Hijab & Hair Wedding", price: 1_200_000, durationHours: 3 },
    { name: "Hijab Pengantin Akad", price: 900_000, durationHours: 2 },
    { name: "Hijab Pengantin Resepsi", price: 1_000_000, durationHours: 2.5 },
    { name: "Hair Do Pengantin", price: 1_100_000, durationHours: 3 },
    { name: "Hair Extension / Sanggul", price: 1_500_000, durationHours: 3 },
    { name: "Hijab Wisuda", price: 450_000, durationHours: 1.5 },
    { name: "Hair Styling Party", price: 400_000, durationHours: 1.5 },
    { name: "Hijab Bridesmaid", price: 350_000, durationHours: 1 },
    { name: "Hijab Ibu Pengantin", price: 400_000, durationHours: 1.5 },
    { name: "Kerudung Segi Empat Styling", price: 300_000, durationHours: 1 },
    { name: "Hair & Hijab Trial", price: 350_000, durationHours: 1.5 },
    { name: "Retouch Hijab / Hair", price: 250_000, durationHours: 1 },
  ],
  dekor: [
    { name: "Dekorasi Pelaminan Gedung", price: 15_000_000, durationHours: 8 },
    { name: "Dekorasi Pelaminan Rumah", price: 10_000_000, durationHours: 8 },
    { name: "Dekorasi Akad Outdoor", price: 12_000_000, durationHours: 8 },
    { name: "Dekorasi Lamaran / Engagement", price: 5_000_000, durationHours: 6 },
    { name: "Dekorasi Siraman / Midodareni", price: 4_500_000, durationHours: 6 },
    { name: "Gapura & Jalan Pengantin", price: 3_500_000, durationHours: 5 },
    { name: "Backdrop Photo Booth", price: 2_500_000, durationHours: 4 },
    { name: "Meja Penerima Tamu", price: 1_500_000, durationHours: 3 },
    { name: "Dekorasi Pelaminan Adat", price: 18_000_000, durationHours: 10 },
    { name: "Lighting Dekorasi", price: 3_000_000, durationHours: 4 },
    { name: "Fresh Flower Arrangement", price: 4_000_000, durationHours: 4 },
    { name: "Dekorasi Mini / Intimate", price: 6_000_000, durationHours: 6 },
  ],
  baju: [
    { name: "Sewa Gaun Pengantin", price: 2_500_000, durationHours: 24 },
    { name: "Sewa Kebaya Pengantin", price: 1_800_000, durationHours: 24 },
    { name: "Sewa Beskap / Jas Pengantin", price: 1_200_000, durationHours: 24 },
    { name: "Sewa Gaun Resepsi", price: 2_000_000, durationHours: 24 },
    { name: "Sewa Kebaya Wisuda", price: 750_000, durationHours: 12 },
    { name: "Sewa Gaun Engagement", price: 1_500_000, durationHours: 12 },
    { name: "Sewa Bridesmaid Dress", price: 650_000, durationHours: 12 },
    { name: "Sewa Baju Adat Lengkap", price: 3_000_000, durationHours: 24 },
    { name: "Sewa Aksesoris Pengantin", price: 500_000, durationHours: 12 },
    { name: "Fitting & Alteration", price: 350_000, durationHours: 2 },
    { name: "Paket Gaun + Kebaya", price: 4_000_000, durationHours: 48 },
    { name: "Sewa Outer / Blazer Event", price: 400_000, durationHours: 12 },
  ],
  photo: [
    { name: "Wedding Photography Full Day", price: 6_000_000, durationHours: 10 },
    { name: "Wedding Photography Half Day", price: 3_500_000, durationHours: 5 },
    { name: "Akad Photography", price: 2_500_000, durationHours: 4 },
    { name: "Resepsi Photography", price: 3_000_000, durationHours: 5 },
    { name: "Prewedding Photography", price: 2_800_000, durationHours: 4 },
    { name: "Engagement Photography", price: 2_000_000, durationHours: 3 },
    { name: "Wisuda Photography", price: 1_200_000, durationHours: 3 },
    { name: "Siraman / Adat Photography", price: 2_200_000, durationHours: 4 },
    { name: "Family Portrait", price: 1_500_000, durationHours: 2 },
    { name: "Foto Produk / Lookbook", price: 1_800_000, durationHours: 3 },
    { name: "Same Day Edit Photo", price: 1_000_000, durationHours: 2 },
    { name: "Album & Cetak Foto", price: 1_500_000, durationHours: 0 },
  ],
  video: [
    { name: "Wedding Videography Full Day", price: 7_000_000, durationHours: 10 },
    { name: "Wedding Videography Half Day", price: 4_000_000, durationHours: 5 },
    { name: "Cinematic Wedding Film", price: 8_500_000, durationHours: 10 },
    { name: "Akad Videography", price: 3_000_000, durationHours: 4 },
    { name: "Resepsi Videography", price: 3_500_000, durationHours: 5 },
    { name: "Prewedding Video", price: 3_200_000, durationHours: 4 },
    { name: "Engagement Video", price: 2_500_000, durationHours: 3 },
    { name: "Same Day Edit Video", price: 2_000_000, durationHours: 3 },
    { name: "Highlight Reel 3–5 menit", price: 1_800_000, durationHours: 0 },
    { name: "Dokumentasi Drone", price: 2_500_000, durationHours: 3 },
    { name: "Teaser Wedding 1 menit", price: 1_200_000, durationHours: 0 },
    { name: "Livestream Acara", price: 3_500_000, durationHours: 6 },
  ],
  content: [
    { name: "Wedding Content Creator Full Day", price: 3_500_000, durationHours: 10 },
    { name: "Wedding Content Creator Half Day", price: 2_000_000, durationHours: 5 },
    { name: "Reels & TikTok Documentation", price: 1_800_000, durationHours: 4 },
    { name: "Behind The Scene Content", price: 1_500_000, durationHours: 4 },
    { name: "Engagement Content Pack", price: 1_200_000, durationHours: 3 },
    { name: "Prewedding Content Pack", price: 1_500_000, durationHours: 3 },
    { name: "Same Day Story Upload", price: 900_000, durationHours: 6 },
    { name: "Brand / Vendor Content Day", price: 2_500_000, durationHours: 6 },
    { name: "Event Highlight Reels", price: 1_300_000, durationHours: 0 },
    { name: "Photo Dump + Caption Pack", price: 800_000, durationHours: 0 },
  ],
  other: [
    { name: "Wedding Organizer Full Service", price: 15_000_000, durationHours: 12 },
    { name: "Wedding Organizer Partial", price: 8_000_000, durationHours: 8 },
    { name: "MC Akad & Resepsi", price: 2_500_000, durationHours: 6 },
    { name: "Entertainment / Band", price: 5_000_000, durationHours: 4 },
    { name: "Sound System", price: 2_000_000, durationHours: 6 },
    { name: "Catering Paket (estimasi)", price: 10_000_000, durationHours: 8 },
    { name: "Undangan Digital", price: 500_000, durationHours: 0 },
    { name: "Souvenir & Gift", price: 1_500_000, durationHours: 0 },
    { name: "Transportasi Pengantin", price: 2_000_000, durationHours: 6 },
    { name: "Konsultan / Planning Session", price: 750_000, durationHours: 2 },
  ],
}

export function presetsForField(fieldId: BusinessFieldId) {
  return SERVICE_PRESETS[fieldId] ?? []
}

export function filterServicePresets(fieldId: BusinessFieldId, query: string) {
  const needle = query.trim().toLowerCase()
  const presets = presetsForField(fieldId)
  if (!needle) return presets
  return presets.filter((preset) => preset.name.toLowerCase().includes(needle))
}
