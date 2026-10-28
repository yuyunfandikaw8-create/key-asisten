import type { BusinessFieldId } from "@/lib/onboarding"
import { fieldById } from "@/lib/onboarding"

export type PortfolioMediaKind = "image" | "video"

export type PortfolioMedia = {
  id: string
  kind: PortfolioMediaKind
  /** Compressed data URL for images; video uses object/data URL when available. */
  dataUrl: string
}

export type PortfolioItem = {
  id: string
  title: string
  category: BusinessFieldId
  description: string
  /** Tahun atau tanggal ISO (YYYY / YYYY-MM / YYYY-MM-DD). */
  date: string
  visible: boolean
  media: PortfolioMedia[]
  createdAt: string
}

/** Placeholder visual ringan untuk data contoh (bukan foto nyata). */
export function portfolioSwatch(
  label: string,
  tone = "c45c4a",
  accent = "f3e6e0"
): string {
  const safe = encodeURIComponent(label.slice(0, 28))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#${accent}"/>
      <stop offset="100%" stop-color="#${tone}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="800" fill="url(#g)"/>
  <circle cx="480" cy="160" r="120" fill="#ffffff22"/>
  <circle cx="120" cy="620" r="160" fill="#00000018"/>
  <text x="40" y="720" fill="#ffffffee" font-family="Georgia, serif" font-size="36">${safe}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function createPortfolioId() {
  return `pf-${crypto.randomUUID().slice(0, 8)}`
}

export function createMediaId() {
  return `pm-${crypto.randomUUID().slice(0, 8)}`
}

export function emptyPortfolioItem(
  category: BusinessFieldId = "makeup"
): Omit<PortfolioItem, "id" | "createdAt"> {
  return {
    title: "",
    category,
    description: "",
    date: String(new Date().getFullYear()),
    visible: true,
    media: [],
  }
}

export function normalizePortfolioItem(raw: unknown): PortfolioItem | null {
  if (!raw || typeof raw !== "object") return null
  const item = raw as Partial<PortfolioItem>
  const title = String(item.title || "").trim()
  if (!title) return null
  const media = Array.isArray(item.media)
    ? item.media
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null
          const mediaItem = entry as Partial<PortfolioMedia>
          const dataUrl = String(mediaItem.dataUrl || "")
          if (!dataUrl) return null
          return {
            id: String(mediaItem.id || createMediaId()),
            kind: mediaItem.kind === "video" ? ("video" as const) : ("image" as const),
            dataUrl,
          }
        })
        .filter((entry): entry is PortfolioMedia => Boolean(entry))
    : []
  return {
    id: String(item.id || createPortfolioId()),
    title,
    category: (item.category as BusinessFieldId) || "makeup",
    description: String(item.description || "").trim(),
    date: String(item.date || "").trim() || String(new Date().getFullYear()),
    visible: item.visible !== false,
    media,
    createdAt:
      typeof item.createdAt === "string" && item.createdAt
        ? item.createdAt
        : new Date().toISOString(),
  }
}

export function normalizePortfolioList(raw: unknown): PortfolioItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizePortfolioItem)
    .filter((item): item is PortfolioItem => Boolean(item))
}

export function visiblePortfolio(items: PortfolioItem[] | undefined | null) {
  return (items ?? []).filter((item) => item.visible && item.media.length > 0)
}

export function portfolioPhotoCount(items: PortfolioItem[] | undefined | null) {
  return visiblePortfolio(items).reduce((sum, item) => sum + item.media.length, 0)
}

export function portfolioCategoryLabel(
  category: BusinessFieldId,
  custom?: { id: string; label: string; emoji: string; short: string }[]
) {
  const field = fieldById(category, custom)
  if (!field) return category
  return `${field.emoji} ${field.short}`
}

export function formatPortfolioDate(value: string) {
  const trimmed = value.trim()
  if (/^\d{4}$/.test(trimmed)) return trimmed
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [y, m] = trimmed.split("-")
    const month = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ][Number(m) - 1]
    return month ? `${month} ${y}` : trimmed
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${trimmed}T12:00:00`))
    } catch {
      return trimmed
    }
  }
  return trimmed
}

/** Kompres gambar ke data URL JPEG agar muat di localStorage / sync. */
export function compressImageFile(
  file: File,
  options?: { maxEdge?: number; quality?: number }
): Promise<string> {
  const maxEdge = options?.maxEdge ?? 1200
  const quality = options?.quality ?? 0.72
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.onload = () => {
      const src = String(reader.result || "")
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(src)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        try {
          resolve(canvas.toDataURL("image/jpeg", quality))
        } catch {
          resolve(src)
        }
      }
      img.onerror = () => reject(new Error("Gambar tidak valid"))
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}

/** Portofolio contoh untuk profil publik demo / Key Partner. */
export function demoPortfolioItems(): PortfolioItem[] {
  return [
    {
      id: "demo-pf-soft-glam",
      title: "Makeup Pengantin — Soft Glam",
      category: "makeup",
      description: "Pernikahan Yogi & Dina · Surabaya",
      date: "2025-08",
      visible: true,
      createdAt: "2025-08-12T10:00:00.000Z",
      media: [
        {
          id: "demo-m1",
          kind: "image",
          dataUrl: portfolioSwatch("Soft Glam", "b85a4a", "f6ebe4"),
        },
        {
          id: "demo-m2",
          kind: "image",
          dataUrl: portfolioSwatch("Detail", "8a4a3d", "edd8cf"),
        },
        {
          id: "demo-m3",
          kind: "image",
          dataUrl: portfolioSwatch("Resepsi", "6d3a32", "e4cfc6"),
        },
      ],
    },
    {
      id: "demo-pf-wisuda",
      title: "Makeup Wisuda Natural",
      category: "makeup",
      description: "Wisuda ITB · Bandung",
      date: "2025",
      visible: true,
      createdAt: "2025-03-20T10:00:00.000Z",
      media: [
        {
          id: "demo-m4",
          kind: "image",
          dataUrl: portfolioSwatch("Wisuda", "5a6d7a", "e4ebf0"),
        },
        {
          id: "demo-m5",
          kind: "image",
          dataUrl: portfolioSwatch("Natural", "3f5460", "d7e0e6"),
        },
      ],
    },
    {
      id: "demo-pf-hair",
      title: "Sanggul Adat Soft",
      category: "hair",
      description: "Akad outdoor · Lembang",
      date: "2024-11",
      visible: true,
      createdAt: "2024-11-02T10:00:00.000Z",
      media: [
        {
          id: "demo-m6",
          kind: "image",
          dataUrl: portfolioSwatch("Sanggul", "6a5a48", "efe6d8"),
        },
      ],
    },
  ]
}

export function demoBio() {
  return "Makeup untuk wedding, engagement, wisuda, dan acara spesial."
}
