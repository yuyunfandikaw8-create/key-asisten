import { addDays, dpFor, todayISO } from "@/lib/format"
import { initialCollaboration } from "@/lib/partners"
import type { Attire, Booking, Expense, Package, StudioState } from "@/lib/types"

export const studio = {
  slug: "laras",
  name: "Key Partner",
  city: "Bandung",
  owner: "Key Partner",
  phone: "081223334455",
  instagram: "@key.partner",
  address: "Jl. Ir. H. Juanda No. 18, Bandung",
  bio: "Rias pengantin, adat, dan wisuda. Jadwal dikunci supaya gaun dan jam tidak bentrok.",
  bank: "Bank Central Asia",
  accountName: "Key Partner",
  accountNumber: "8822100345",
}

export const packages: Package[] = [
  {
    id: "emas",
    name: "Paket Emas",
    price: 6_500_000,
    blurb: "Rias pengantin akad dan resepsi, termasuk keluarga inti.",
    includes: [
      "Makeup & hair pengantin",
      "2 orang keluarga",
      "Retouch resepsi",
      "Aksesoris standar",
    ],
  },
  {
    id: "adat",
    name: "Paket Adat",
    price: 8_500_000,
    blurb: "Paes ageng atau adat Sunda, lengkap dengan ibu dan keluarga.",
    includes: [
      "Rias adat pengantin",
      "Ibu pengantin",
      "4 keluarga",
      "Retouch dua sesi",
    ],
  },
  {
    id: "perak",
    name: "Paket Perak",
    price: 3_500_000,
    blurb: "Engagement, lamaran, atau prewedding setengah hari.",
    includes: ["Makeup & hair", "1 keluarga", "Aksesoris", "Retouch singkat"],
  },
  {
    id: "wisuda",
    name: "Paket Wisuda",
    price: 1_800_000,
    blurb: "Rias wisuda natural yang tetap terbaca di foto.",
    includes: ["Makeup wisuda", "Hair styling", "Retouch sekali"],
  },
]

export const attires: Attire[] = [
  {
    id: "kebaya-solo",
    name: "Kebaya Solo Emas",
    category: "Kebaya",
    tone: "#c6a15b",
    size: "M",
  },
  {
    id: "gaun-ivory",
    name: "Gaun Ivory Sifon",
    category: "Gaun",
    tone: "#f3eee4",
    size: "M",
  },
  {
    id: "kebaya-sage",
    name: "Kebaya Sage",
    category: "Kebaya",
    tone: "#c5d2c2",
    size: "L",
  },
  {
    id: "beskap",
    name: "Beskap Hitam",
    category: "Beskap",
    tone: "#241c1d",
    size: "L",
  },
  {
    id: "gaun-maroon",
    name: "Gaun Maroon Velvet",
    category: "Gaun",
    tone: "#7a2e3a",
    size: "S",
  },
]

export const SAMPLE_CHAT = `Halo kak, saya Nisa Amelia
Mau booking rias pengantin
Tanggal 20 November 2026 jam 07.30
Lokasi: Gedung Sasana Budaya, Bandung
Paket emas ya kak
HP 081234009911`

function booking(
  input: Omit<Booking, "createdAt" | "source" | "attireReturned" | "notes"> &
    Partial<Pick<Booking, "createdAt" | "source" | "attireReturned" | "notes">>
): Booking {
  return {
    source: "studio",
    attireReturned: false,
    notes: "",
    createdAt: new Date().toISOString(),
    ...input,
  }
}

export function createSeed(): StudioState {
  const today = todayISO()
  const emas = packages[0]
  const adat = packages[1]
  const perak = packages[2]
  const wisuda = packages[3]

  const bookings: Booking[] = [
    booking({
      id: "bk-sari",
      clientName: "Sari Melati",
      phone: "081298881111",
      eventType: "pengantin",
      date: today,
      time: "08:00",
      location: "Gedung Merdeka, Bandung",
      packageId: emas.id,
      attireId: "kebaya-solo",
      price: emas.price,
      dp: dpFor(emas.price),
      paid: dpFor(emas.price),
    }),
    booking({
      id: "bk-kirana",
      clientName: "Kirana Putri",
      phone: "081377770002",
      eventType: "engagement",
      date: today,
      time: "10:00",
      location: "Rumah keluarga, Ciumbuleuit",
      packageId: perak.id,
      attireId: "kebaya-solo",
      price: perak.price,
      dp: dpFor(perak.price),
      paid: 0,
      notes: "Minta kebaya yang sama dengan Sari. Perlu diganti.",
    }),
    booking({
      id: "bk-dinda",
      clientName: "Dinda Kusuma",
      phone: "082122223344",
      eventType: "pengantin",
      date: addDays(today, 1),
      time: "06:30",
      location: "Rumah keluarga, Dago",
      packageId: adat.id,
      attireId: "gaun-ivory",
      price: adat.price,
      dp: dpFor(adat.price),
      paid: 0,
    }),
    booking({
      id: "bk-lala",
      clientName: "Lala Anggraini",
      phone: "081555009900",
      eventType: "engagement",
      date: addDays(today, 6),
      time: "15:00",
      location: "The Stone Hotel, Bandung",
      packageId: perak.id,
      attireId: "kebaya-sage",
      price: perak.price,
      dp: dpFor(perak.price),
      paid: dpFor(perak.price),
    }),
    booking({
      id: "bk-nadia",
      clientName: "Nadia Permata",
      phone: "081800011122",
      eventType: "pengantin",
      date: addDays(today, -2),
      time: "07:00",
      location: "Gedung Sate",
      packageId: emas.id,
      attireId: "gaun-maroon",
      price: emas.price,
      dp: dpFor(emas.price),
      paid: emas.price,
      notes: "Gaun belum kembali dari keluarga.",
    }),
    booking({
      id: "bk-maya",
      clientName: "Maya Lestari",
      phone: "081900000123",
      eventType: "prewedding",
      date: addDays(today, 12),
      time: "09:00",
      location: "Studio foto Dago",
      packageId: perak.id,
      attireId: null,
      price: perak.price,
      dp: dpFor(perak.price),
      paid: perak.price,
    }),
    booking({
      id: "bk-intan",
      clientName: "Intan Prameswari",
      phone: "081211110000",
      eventType: "pesta",
      date: addDays(today, 18),
      time: "16:00",
      location: "Rumah, Antapani",
      packageId: perak.id,
      attireId: "beskap",
      price: perak.price,
      dp: dpFor(perak.price),
      paid: 0,
    }),
    booking({
      id: "bk-raka",
      clientName: "Raka Wijaya",
      phone: "082166667788",
      eventType: "wisuda",
      date: addDays(today, 3),
      time: "13:00",
      location: "ITB Ganesha",
      packageId: wisuda.id,
      attireId: null,
      price: wisuda.price,
      dp: dpFor(wisuda.price),
      paid: wisuda.price,
    }),
    booking({
      id: "bk-past-1",
      clientName: "Ayu Kartika",
      phone: "081300000001",
      eventType: "pengantin",
      date: addDays(today, -28),
      time: "08:00",
      location: "Gedung Sabilulungan",
      packageId: adat.id,
      attireId: null,
      price: adat.price,
      dp: dpFor(adat.price),
      paid: adat.price,
      attireReturned: true,
    }),
    booking({
      id: "bk-past-2",
      clientName: "Bunga Savitri",
      phone: "081300000002",
      eventType: "pengantin",
      date: addDays(today, -46),
      time: "07:30",
      location: "Hotel Savoy Homann",
      packageId: emas.id,
      attireId: null,
      price: emas.price,
      dp: dpFor(emas.price),
      paid: emas.price,
      attireReturned: true,
    }),
    booking({
      id: "bk-past-3",
      clientName: "Citra Handayani",
      phone: "081300000003",
      eventType: "wisuda",
      date: addDays(today, -12),
      time: "14:00",
      location: "Unpad Dipatiukur",
      packageId: wisuda.id,
      attireId: null,
      price: wisuda.price,
      dp: dpFor(wisuda.price),
      paid: wisuda.price,
      attireReturned: true,
    }),
    booking({
      id: "bk-past-4",
      clientName: "Dewi Anindya",
      phone: "081300000004",
      eventType: "pengantin",
      date: addDays(today, -70),
      time: "06:00",
      location: "Rumah, Lembang",
      packageId: adat.id,
      attireId: null,
      price: adat.price,
      dp: dpFor(adat.price),
      paid: adat.price,
      attireReturned: true,
    }),
  ]

  const expenses: Expense[] = [
    {
      id: "ex-1",
      label: "Kuas, spons, dan softlens",
      amount: 2_450_000,
      date: addDays(today, -40),
    },
    {
      id: "ex-2",
      label: "Transport bulan ini",
      amount: 850_000,
      date: addDays(today, -6),
    },
    {
      id: "ex-3",
      label: "Cuci dan setrika gaun",
      amount: 600_000,
      date: addDays(today, -3),
    },
    {
      id: "ex-4",
      label: "Sewa lampu tambahan",
      amount: 400_000,
      date: addDays(today, -55),
    },
  ]

  return {
    city: studio.city,
    bookings,
    expenses,
    ...initialCollaboration(),
  }
}

export function packageById(id: string) {
  return packages.find((item) => item.id === id)
}

export function attireById(id: string | null) {
  if (!id) return undefined
  return attires.find((item) => item.id === id)
}
