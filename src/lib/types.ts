export type EventType =
  | "pengantin"
  | "akad"
  | "wisuda"
  | "engagement"
  | "prewedding"
  | "pesta"

export type BookingSource = "studio" | "pricelist" | "chat"

export type PaymentStatus = "belum_dp" | "belum_lunas" | "lunas"

export type Package = {
  id: string
  name: string
  price: number
  blurb: string
  includes: string[]
}

export type Attire = {
  id: string
  name: string
  category: string
  tone: string
  size: string
}

export type Booking = {
  id: string
  clientName: string
  phone: string
  eventType: EventType
  date: string
  time: string
  location: string
  packageId: string
  attireId: string | null
  price: number
  dp: number
  paid: number
  notes: string
  source: BookingSource
  attireReturned: boolean
  createdAt: string
}

export type Expense = {
  id: string
  label: string
  amount: number
  date: string
}

export type Trade = "makeup" | "dekor" | "baju" | "hair"

export type PartnershipStatus = "diminta" | "diterima"

export type Partnership = {
  partnerId: string
  status: PartnershipStatus
  note: string
  createdAt: string
}

export type Combo = {
  id: string
  name: string
  packageId: string
  partnerIds: string[]
  discount: number
  note: string
  published: boolean
  createdAt: string
}

export type StudioState = {
  bookings: Booking[]
  expenses: Expense[]
  partnerships: Partnership[]
  combos: Combo[]
}

export type NewBooking = Omit<Booking, "id" | "createdAt">
