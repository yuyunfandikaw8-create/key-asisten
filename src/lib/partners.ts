import type { Combo, InboxMessage, Partnership, Trade } from "@/lib/types"

export const TRADE_LABEL: Record<Trade, string> = {
  makeup: "Makeup",
  dekor: "Dekor",
  baju: "Sewa baju",
  hair: "Hairdo",
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
  {
    id: "hair-sanggul-dago",
    name: "Sanggul Dago",
    trade: "hair",
    city: "Bandung",
    area: "Dago",
    phone: "081944400001",
    blurb: "Sanggul adat, soft updo, dan penataan rambut pengantin sebelum akad.",
    offer: "Sanggul adat dan soft updo",
    share: 2_200_000,
    busyOffsets: [0],
    repliesFast: true,
  },
  {
    id: "hair-ikat-lembang",
    name: "Ikat Lembang",
    trade: "hair",
    city: "Bandung",
    area: "Lembang",
    phone: "081944400002",
    blurb: "Downstyle, braid, dan hairpiece untuk akad outdoor.",
    offer: "Downstyle dan braid outdoor",
    share: 1_750_000,
    busyOffsets: [],
    repliesFast: true,
  },
  {
    id: "hair-sisir-kota",
    name: "Sisir Kota",
    trade: "hair",
    city: "Jakarta",
    area: "Kemang",
    phone: "081944400003",
    blurb: "Penataan rambut resepsi dan pergantian look. Bisa datang ke kota acara H-1.",
    offer: "Hairdo resepsi",
    share: 3_000_000,
    busyOffsets: [2],
    repliesFast: false,
  },
  {
    id: "dekor-kalimas",
    name: "Kalimas Dekor",
    trade: "dekor",
    city: "Surabaya",
    area: "Gubeng",
    phone: "081755500001",
    blurb: "Pelaminan modern dan lighting untuk gedung di Surabaya.",
    offer: "Pelaminan gedung Surabaya",
    share: 11_000_000,
    busyOffsets: [1],
    repliesFast: true,
  },
  {
    id: "makeup-tunjungan",
    name: "Rias Tunjungan",
    trade: "makeup",
    city: "Surabaya",
    area: "Tunjungan",
    phone: "081755500002",
    blurb: "Rias keluarga dan touch-up resepsi di hotel pusat kota.",
    offer: "Rias keluarga Surabaya",
    share: 2_800_000,
    busyOffsets: [],
    repliesFast: true,
  },
  {
    id: "hair-pakuwon",
    name: "Sanggul Pakuwon",
    trade: "hair",
    city: "Surabaya",
    area: "Pakuwon",
    phone: "081755500003",
    blurb: "Sanggul adat Jawa Timur dan soft updo untuk akad.",
    offer: "Sanggul adat Jawa Timur",
    share: 2_000_000,
    busyOffsets: [0],
    repliesFast: true,
  },
  {
    id: "baju-gendis",
    name: "Gendis Kebaya",
    trade: "baju",
    city: "Surabaya",
    area: "Wonokromo",
    phone: "081755500004",
    blurb: "Kebaya pengantin dan basahan. Fitting di studio Wonokromo.",
    offer: "Kebaya dan basahan",
    share: 3_200_000,
    busyOffsets: [2, 5],
    repliesFast: false,
  },
  {
    id: "dekor-menteng-kaca",
    name: "Menteng Kaca",
    trade: "dekor",
    city: "Jakarta",
    area: "Menteng",
    phone: "081766600001",
    blurb: "Dekor ballroom dengan akrilik dan bunga import.",
    offer: "Dekor ballroom",
    share: 18_000_000,
    busyOffsets: [0],
    repliesFast: true,
  },
  {
    id: "makeup-senopati",
    name: "Senopati Glow",
    trade: "makeup",
    city: "Jakarta",
    area: "Senopati",
    phone: "081766600002",
    blurb: "Rias pengantin dan keluarga untuk hotel di Jakarta Selatan.",
    offer: "Rias hotel Jakarta",
    share: 4_500_000,
    busyOffsets: [],
    repliesFast: false,
  },
]

export function partnerById(id: string) {
  return partners.find((partner) => partner.id === id)
}

export function partnersInCity(city: string) {
  return partners.filter((partner) => partner.city === city)
}

export function initialCollaboration(): {
  partnerships: Partnership[]
  combos: Combo[]
  messages: InboxMessage[]
} {
  const now = Date.now()
  return {
    partnerships: [
      {
        partnerId: "dekor-rumah-bunga",
        status: "diterima",
        note: "Sering satu tanggal untuk akad di rumah.",
        createdAt: new Date(now - 86_400_000 * 3).toISOString(),
      },
      {
        partnerId: "baju-lemari",
        status: "diminta",
        note: "Mau tahan kebaya adat untuk klien Laras.",
        createdAt: new Date(now - 86_400_000).toISOString(),
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
        createdAt: new Date(now - 86_400_000 * 2).toISOString(),
      },
    ],
    messages: [
      {
        id: "msg-bunga-1",
        partnerId: "dekor-rumah-bunga",
        city: "Bandung",
        sender: "partner",
        body: "Laras, tanggal 20 Nov pelaminan kayu masih kosong. Mau kita kunci untuk akad Sunda?",
        createdAt: new Date(now - 3_600_000 * 5).toISOString(),
        read: false,
      },
      {
        id: "msg-bunga-2",
        partnerId: "dekor-rumah-bunga",
        city: "Bandung",
        sender: "studio",
        body: "Boleh. Klien di Lembang, jam 08.00. Nanti aku kirim denah rumahnya.",
        createdAt: new Date(now - 3_600_000 * 4).toISOString(),
        read: true,
      },
      {
        id: "msg-lemari-1",
        partnerId: "baju-lemari",
        city: "Bandung",
        sender: "partner",
        body: "Kebaya Solo Emas ukuran M masih siap. Fitting bisa besok sore di Dago.",
        createdAt: new Date(now - 3_600_000 * 2).toISOString(),
        read: false,
      },
      {
        id: "msg-kalimas-1",
        partnerId: "dekor-kalimas",
        city: "Surabaya",
        sender: "partner",
        body: "Halo studio Surabaya. Ballroom Gubeng tanggal 12 Des masih kosong untuk kombo pelaminan.",
        createdAt: new Date(now - 3_600_000).toISOString(),
        read: false,
      },
      {
        id: "msg-tunjungan-1",
        partnerId: "makeup-tunjungan",
        city: "Surabaya",
        sender: "partner",
        body: "Kalau butuh asisten rias keluarga di Tunjungan, chat di sini saja. Biasanya balas cepat.",
        createdAt: new Date(now - 1_800_000).toISOString(),
        read: false,
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
