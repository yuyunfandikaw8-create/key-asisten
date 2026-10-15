import { attireById } from "@/lib/catalog"
import { daysUntil, todayISO } from "@/lib/format"
import type { Booking, Expense, PaymentStatus } from "@/lib/types"

export function paymentStatus(booking: Booking): PaymentStatus {
  if (booking.paid >= booking.price) return "lunas"
  if (booking.paid <= 0) return "belum_dp"
  return "belum_lunas"
}

export function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

export type ConflictPair = {
  a: Booking
  b: Booking
  timeClose: boolean
  sameAttire: boolean
}

export function conflictPairs(bookings: Booking[]) {
  const pairs: ConflictPair[] = []
  const upcoming = bookings.filter((booking) => daysUntil(booking.date) >= 0)
  for (let i = 0; i < upcoming.length; i += 1) {
    for (let j = i + 1; j < upcoming.length; j += 1) {
      const a = upcoming[i]
      const b = upcoming[j]
      if (a.date !== b.date) continue
      const timeClose = Math.abs(minutes(a.time) - minutes(b.time)) < 240
      const sameAttire = Boolean(a.attireId && a.attireId === b.attireId)
      if (timeClose || sameAttire) pairs.push({ a, b, timeClose, sameAttire })
    }
  }
  return pairs
}

export function conflictsFor(
  bookings: Booking[],
  candidate: { id?: string; date: string; time: string; attireId?: string | null }
) {
  return bookings.filter((booking) => {
    if (booking.id === candidate.id) return false
    if (booking.date !== candidate.date) return false
    const timeClose = Math.abs(minutes(booking.time) - minutes(candidate.time)) < 240
    const sameAttire = Boolean(
      candidate.attireId && booking.attireId === candidate.attireId
    )
    return timeClose || sameAttire
  })
}

export function isSameMonth(iso: string, ref = new Date()) {
  const date = new Date(`${iso}T12:00:00`)
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth()
}

export function isSameYear(iso: string, ref = new Date()) {
  return new Date(`${iso}T12:00:00`).getFullYear() === ref.getFullYear()
}

export function sortBookings(bookings: Booking[]) {
  return [...bookings].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  )
}

export function balance(booking: Booking) {
  return Math.max(booking.price - booking.paid, 0)
}

export function financeSummary(bookings: Booking[], expenses: Expense[]) {
  const yearBookings = bookings.filter((booking) => isSameYear(booking.date))
  const yearExpenses = expenses.filter((expense) => isSameYear(expense.date))
  const income = yearBookings.reduce((sum, booking) => sum + booking.paid, 0)
  const spent = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const outstanding = yearBookings.reduce((sum, booking) => sum + balance(booking), 0)
  return { income, spent, profit: income - spent, outstanding }
}

export function collectionReminders(bookings: Booking[]) {
  return sortBookings(
    bookings.filter((booking) => {
      const days = daysUntil(booking.date)
      return days >= 0 && days <= 7 && paymentStatus(booking) !== "lunas"
    })
  )
}

export function lateAttire(bookings: Booking[]) {
  return bookings.filter(
    (booking) =>
      Boolean(booking.attireId) &&
      !booking.attireReturned &&
      daysUntil(booking.date) < 0
  )
}

export function attireStatus(attireId: string, bookings: Booking[]) {
  const late = lateAttire(bookings).find((booking) => booking.attireId === attireId)
  if (late) {
    return {
      label: "Telat kembali",
      tone: "late" as const,
      booking: late,
    }
  }
  const upcoming = sortBookings(bookings).find(
    (booking) =>
      booking.attireId === attireId &&
      !booking.attireReturned &&
      daysUntil(booking.date) >= 0
  )
  if (upcoming) {
    return {
      label: daysUntil(upcoming.date) === 0 ? "Dipakai hari ini" : "Sudah dipegang",
      tone: "held" as const,
      booking: upcoming,
    }
  }
  return { label: "Tersedia", tone: "free" as const, booking: undefined }
}

export function conflictLabel(pair: ConflictPair) {
  const attire = attireById(pair.a.attireId)
  if (pair.timeClose && pair.sameAttire) {
    return `Jam berdekatan dan ${attire?.name ?? "gaun"} dobel`
  }
  if (pair.sameAttire) return `${attire?.name ?? "Gaun"} dipakai dua klien`
  return "Jam berdekatan di hari yang sama"
}

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function recentMonths(count = 4, anchor = todayISO()) {
  const keys: string[] = []
  const cursor = new Date(`${anchor}T12:00:00`)
  cursor.setDate(1)
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(cursor)
    date.setMonth(cursor.getMonth() - index)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    keys.push(`${date.getFullYear()}-${month}`)
  }
  return keys
}

export function monthlyIncomeSeries(bookings: Booking[], count = 6, anchor = todayISO()) {
  const keys = recentMonths(count, anchor)
  return keys.map((key) => ({
    key,
    label: key.slice(5),
    value: bookings
      .filter((booking) => monthKey(booking.date) === key)
      .reduce((sum, booking) => sum + booking.paid, 0),
  }))
}
