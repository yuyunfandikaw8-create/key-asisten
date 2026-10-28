import {
  partnerFieldId,
  partnerPortfolioCount,
  partnerRating,
  type Partner,
} from "@/lib/partners"
import {
  formatPortfolioDate,
  portfolioSwatch,
  type PortfolioItem,
} from "@/lib/portfolio"
import type { BusinessFieldId } from "@/lib/onboarding"

const TONES: [string, string][] = [
  ["b85a4a", "f6ebe4"],
  ["5a6d7a", "e4ebf0"],
  ["6a5a48", "efe6d8"],
  ["4a6b5a", "e4efe8"],
  ["6d4a5a", "f0e4ea"],
]

/** Portofolio contoh untuk kartu vendor marketplace (bukan profil owner nyata). */
export function showcasePortfolio(partner: Partner): PortfolioItem[] {
  const count = Math.min(6, Math.max(3, Math.floor(partnerPortfolioCount(partner) / 4)))
  const field = partnerFieldId(partner.trade) as BusinessFieldId
  const items: PortfolioItem[] = []
  for (let i = 0; i < count; i += 1) {
    const [tone, accent] = TONES[i % TONES.length]
    const title =
      i === 0
        ? `${partner.offer} — Highlight`
        : i === 1
          ? `Proyek ${partner.area}`
          : `Karya ${i + 1}`
    items.push({
      id: `${partner.id}-pf-${i}`,
      title,
      category: field,
      description: `${partner.city} · ${partner.area}`,
      date: String(2026 - (i % 3)),
      visible: true,
      createdAt: new Date().toISOString(),
      media: [
        {
          id: `${partner.id}-pm-${i}a`,
          kind: "image",
          dataUrl: portfolioSwatch(title.slice(0, 18), tone, accent),
        },
        ...(i === 0
          ? [
              {
                id: `${partner.id}-pm-${i}b`,
                kind: "image" as const,
                dataUrl: portfolioSwatch("Detail", tone, accent),
              },
            ]
          : []),
      ],
    })
  }
  return items
}

export function showcaseServices(partner: Partner) {
  const base = partner.share
  return [
    { id: `${partner.id}-svc-1`, name: partner.offer, price: base, blurb: partner.blurb },
    {
      id: `${partner.id}-svc-2`,
      name: `${TRADE_SHORT[partner.trade]} Akad`,
      price: Math.round(base * 0.7),
      blurb: "Paket singkat untuk akad",
    },
    {
      id: `${partner.id}-svc-3`,
      name: `${TRADE_SHORT[partner.trade]} Wisuda / Acara`,
      price: Math.round(base * 0.35),
      blurb: "Look natural untuk acara spesial",
    },
  ]
}

const TRADE_SHORT: Record<Partner["trade"], string> = {
  makeup: "Makeup",
  hair: "Hair",
  dekor: "Dekor",
  baju: "Attire",
  foto: "Foto",
  content: "Konten",
}

export function showcaseMeta(partner: Partner) {
  return {
    rating: partnerRating(partner),
    portfolioCount: partnerPortfolioCount(partner),
    available: partner.available !== false && partner.busyOffsets.length < 3,
    dateLabel: formatPortfolioDate(String(new Date().getFullYear())),
  }
}
