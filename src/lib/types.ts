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

export type StudioState = {
  bookings: Booking[]
  expenses: Expense[]
}

export type NewBooking = Omit<Booking, "id" | "createdAt">
