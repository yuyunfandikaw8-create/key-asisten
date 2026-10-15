import type { Combo, Partnership, Trade } from "@/lib/types"

export const TRADE_LABEL: Record<Trade, string> = {
  makeup: "Makeup",
  dekor: "Dekor",
  baju: "Sewa baju",
}

export type Partner = {
  id: string
  name: string
  trade: Trade
  city: string
  area: string
  phone: string
  blurb: string
  offer: string
  share: number
  busyOffsets: number[]
  repliesFast: boolean
}

export const partners: Partner[] = [
  {
    id: "dekor-rumah-bunga",
    name: "Rumah Bunga Dekor",
    trade: "dekor",
    city: "Bandung",
    area: "Dago",
    phone: "081711100001",
    blurb: "Pelaminan kayu, taman, dan jalan pengantin untuk akad di rumah.",
    offer: "Pelaminan adat Sunda",
    share: 12_000_000,
    busyOffsets: [1],
    repliesFast: true,
  },
  {
    id: "dekor-sunda-taman",
    name: "Sunda Taman",
    trade: "dekor",
    city: "Bandung",
    area: "Lembang",
    phone: "081711100002",
    blurb: "Gapura daun dan latar taman. Cocok untuk akad outdoor.",
    offer: "Gapura dan jalan bunga",
    share: 9_000_000,
    busyOffsets: [],
    repliesFast: false,
  },
  {
    id: "dekor-pelaminan-emas",
    name: "Pelaminan Emas",
    trade: "dekor",
    city: "Cimahi",
    area: "Cimahi Tengah",
    phone: "081711100003",
    blurb: "Pelaminan gedung dengan lighting hangat.",
    offer: "Pelaminan gedung",
    share: 7_500_000,
    busyOffsets: [0],
    repliesFast: true,
  },
  {
    id: "baju-lemari",
    name: "Lemari Kebaya",
    trade: "baju",
    city: "Bandung",
    area: "Dago",
    phone: "081822200001",
    blurb: "Kebaya adat, gaun resepsi, dan beskap. Ukuran dicoba di studio.",
    offer: "Kebaya pengantin dan beskap",
    share: 3_500_000,
    busyOffsets: [0, 6],
    repliesFast: true,
  },
  {
    id: "baju-atelier",
    name: "Atelier Gaun",
    trade: "baju",
    city: "Jakarta",
    area: "Menteng",
    phone: "081822200002",
    blurb: "Gaun resepsi dan jas. Pengiriman ke Bandung perlu sehari.",
    offer: "Gaun resepsi",
    share: 5_000_000,
    busyOffsets: [],
    repliesFast: false,
  },
  {
    id: "baju-jas",
    name: "Jas & Beskap",
    trade: "baju",
    city: "Bandung",
    area: "Antapani",
    phone: "081822200003",
    blurb: "Beskap dan jas pengantin pria, termasuk fitting.",
    offer: "Beskap pengantin pria",
    share: 1_200_000,
    busyOffsets: [],
    repliesFast: true,
  },
  {
    id: "makeup-sentuh",
    name: "Sentuh Rias",
    trade: "makeup",
    city: "Bandung",
    area: "Ciumbuleuit",
    phone: "081933300001",
    blurb: "Asisten rias untuk keluarga dan ibu pengantin.",
    offer: "Rias keluarga",
    share: 2_500_000,
    busyOffsets: [3],
    repliesFast: true,
  },
  {
    id: "makeup-kuas",
    name: "Kuas Kota",
    trade: "makeup",
    city: "Bandung",
    area: "Buahbatu",
    phone: "081933300002",
    blurb: "Touch-up resepsi kalau acara pindah gedung.",
    offer: "Touch-up resepsi",
    share: 1_800_000,
    busyOffsets: [],
    repliesFast: false,
  },
]

export function partnerById(id: string) {
  return partners.find((partner) => partner.id === id)
}

export function initialCollaboration(): {
  partnerships: Partnership[]
  combos: Combo[]
} {
  return {
    partnerships: [
      {
        partnerId: "dekor-rumah-bunga",
        status: "diterima",
        note: "Sering satu tanggal untuk akad di rumah.",
        createdAt: new Date().toISOString(),
      },
      {
        partnerId: "baju-lemari",
        status: "diminta",
        note: "Mau tahan kebaya adat untuk klien Laras.",
        createdAt: new Date().toISOString(),
      },
    ],
    combos: [
      {
        id: "combo-akad-sunda",
        name: "Akad Sunda di rumah",
        packageId: "adat",
        partnerIds: ["dekor-rumah-bunga"],
        discount: 500_000,
        note: "Rias adat dan pelaminan dalam satu harga.",
        published: true,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export function sharesOf(partnerIds: string[]) {
  return partnerIds.reduce((sum, id) => sum + (partnerById(id)?.share ?? 0), 0)
}

export function comboTotal(packagePrice: number, partnerIds: string[], discount: number) {
  return Math.max(packagePrice + sharesOf(partnerIds) - discount, 0)
}
