import { normalizeEmail } from "@/lib/auth"
import { partners, TRADE_LABEL, type Partner } from "@/lib/partners"
import type { Trade } from "@/lib/types"

export const CLIENT_WORKSPACE_KEY = "key-assistant.client-workspace.v1"

export type ClientViewMode = "real" | "demo"

export type ClientBookingStatus =
  | "belum_booking"
  | "menunggu_konfirmasi"
  | "menunggu_dp"
  | "sudah_dp"
  | "lunas"
  | "selesai"

export const CLIENT_BOOKING_STATUS_LABEL: Record<ClientBookingStatus, string> = {
  belum_booking: "Belum booking",
  menunggu_konfirmasi: "Menunggu konfirmasi",
  menunggu_dp: "Menunggu DP",
  sudah_dp: "Sudah DP",
  lunas: "Lunas",
  selesai: "Selesai",
}

export type ClientNeedId =
  | "makeup"
  | "hair"
  | "dekor"
  | "baju"
  | "photo"
  | "video"
  | "content"

export const CLIENT_VENDOR_CATEGORIES: {
  id: ClientNeedId
  label: string
  emoji: string
  trades: Trade[]
}[] = [
  { id: "makeup", label: "MUA", emoji: "💄", trades: ["makeup"] },
  { id: "hair", label: "Hair & Hijab", emoji: "🧕", trades: ["hair"] },
  { id: "dekor", label: "Decoration", emoji: "🌸", trades: ["dekor"] },
  { id: "baju", label: "Attire", emoji: "👗", trades: ["baju"] },
  { id: "photo", label: "Photographer", emoji: "📸", trades: ["foto"] },
  { id: "video", label: "Videographer", emoji: "🎥", trades: ["foto"] },
  { id: "content", label: "Content Creator", emoji: "🎬", trades: ["content"] },
]

export type ClientEventSlot = {
  needId: ClientNeedId
  partnerId: string | null
  status: ClientBookingStatus
}

export type ClientEvent = {
  id: string
  title: string
  date: string
  location: string
  city: string
  slots: ClientEventSlot[]
  createdAt: string
}

export type ClientWorkspace = {
  shortlist: string[]
  events: ClientEvent[]
  activeEventId: string | null
}

export function emptyClientWorkspace(): ClientWorkspace {
  return { shortlist: [], events: [], activeEventId: null }
}

export function workspaceIsEmpty(workspace: ClientWorkspace) {
  return workspace.events.length === 0 && workspace.shortlist.length === 0
}

/**
 * Data contoh untuk mode “Coba data contoh”.
 * Tidak pernah ditulis ke storage Data Saya.
 */
export function sampleClientWorkspace(city = "Bandung"): ClientWorkspace {
  const inSurabaya = city.trim().toLowerCase() === "surabaya"
  if (inSurabaya) {
    const eventId = "demo-event-lamaran-yogi"
    return {
      shortlist: ["makeup-tunjungan", "dekor-kalimas", "foto-frame-suro", "hair-pakuwon"],
      events: [
        {
          id: eventId,
          title: "Lamaran Yogi & Dina",
          date: "2026-11-08",
          location: "Hotel Bumi, Surabaya",
          city: "Surabaya",
          createdAt: "2026-10-01T08:00:00.000Z",
          slots: [
            { needId: "makeup", partnerId: "makeup-tunjungan", status: "menunggu_dp" },
            { needId: "hair", partnerId: "hair-pakuwon", status: "menunggu_konfirmasi" },
            { needId: "dekor", partnerId: "dekor-kalimas", status: "sudah_dp" },
            { needId: "baju", partnerId: null, status: "belum_booking" },
            { needId: "photo", partnerId: "foto-frame-suro", status: "lunas" },
            { needId: "video", partnerId: null, status: "belum_booking" },
            { needId: "content", partnerId: "content-cerita-suro", status: "belum_booking" },
          ],
        },
      ],
      activeEventId: eventId,
    }
  }

  const eventId = "demo-event-pernikahan-yogi-dina"
  return {
    shortlist: [
      "makeup-sentuh",
      "makeup-kuas",
      "hair-sanggul-dago",
      "dekor-rumah-bunga",
      "baju-lemari",
      "foto-lensa-dago",
      "content-reel-bandung",
    ],
    events: [
      {
        id: eventId,
        title: "Pernikahan Yogi & Dina",
        date: "2026-12-12",
        location: "Gedung Merdeka, Bandung",
        city: "Bandung",
        createdAt: "2026-09-15T10:00:00.000Z",
        slots: [
          { needId: "makeup", partnerId: "makeup-sentuh", status: "sudah_dp" },
          { needId: "hair", partnerId: "hair-sanggul-dago", status: "menunggu_konfirmasi" },
          { needId: "dekor", partnerId: "dekor-rumah-bunga", status: "menunggu_dp" },
          { needId: "baju", partnerId: "baju-lemari", status: "belum_booking" },
          { needId: "photo", partnerId: "foto-lensa-dago", status: "lunas" },
          { needId: "video", partnerId: null, status: "belum_booking" },
          { needId: "content", partnerId: "content-reel-bandung", status: "menunggu_konfirmasi" },
        ],
      },
    ],
    activeEventId: eventId,
  }
}

export function workspaceKeyFor(email: string) {
  return `${CLIENT_WORKSPACE_KEY}:${normalizeEmail(email)}`
}

export function previewFlagKeyFor(email: string) {
  return `${CLIENT_WORKSPACE_KEY}:preview:${normalizeEmail(email)}`
}

export function readClientWorkspace(email: string | undefined | null): ClientWorkspace {
  if (!email || typeof window === "undefined") return emptyClientWorkspace()
  try {
    const raw = localStorage.getItem(workspaceKeyFor(email))
    if (!raw) return emptyClientWorkspace()
    const parsed = JSON.parse(raw) as Partial<ClientWorkspace>
    return {
      shortlist: Array.isArray(parsed.shortlist) ? parsed.shortlist : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      activeEventId: typeof parsed.activeEventId === "string" ? parsed.activeEventId : null,
    }
  } catch {
    return emptyClientWorkspace()
  }
}

export function writeClientWorkspace(
  email: string | undefined | null,
  workspace: ClientWorkspace
) {
  if (!email || typeof window === "undefined") return
  try {
    localStorage.setItem(workspaceKeyFor(email), JSON.stringify(workspace))
  } catch {
    // ignore
  }
}

export function categoryById(id: ClientNeedId) {
  return CLIENT_VENDOR_CATEGORIES.find((item) => item.id === id)
}

export function partnerById(id: string): Partner | undefined {
  return partners.find((partner) => partner.id === id)
}

export function partnersForCategory(needId: ClientNeedId, city?: string) {
  const category = categoryById(needId)
  if (!category) return []
  const matched = partners.filter((partner) => category.trades.includes(partner.trade))
  if (!city) return matched
  const inCity = matched.filter((partner) => partner.city === city)
  return inCity.length ? inCity : matched
}

export function defaultEventSlots(): ClientEventSlot[] {
  return CLIENT_VENDOR_CATEGORIES.map((category) => ({
    needId: category.id,
    partnerId: null,
    status: "belum_booking" as const,
  }))
}

export function createClientEvent(input: {
  title: string
  date: string
  location: string
  city: string
}): ClientEvent {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    date: input.date,
    location: input.location.trim(),
    city: input.city.trim(),
    slots: defaultEventSlots(),
    createdAt: new Date().toISOString(),
  }
}

export function tradeLabelForPartner(partner: Partner) {
  return TRADE_LABEL[partner.trade]
}
