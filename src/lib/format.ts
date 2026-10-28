import type { BookingApprovalStatus, EventType, PaymentStatus } from "@/lib/types"

export const EVENT_LABEL: Record<EventType, string> = {
  pengantin: "Rias pengantin",
  akad: "Akad",
  wisuda: "Wisuda",
  engagement: "Engagement",
  prewedding: "Prewedding",
  pesta: "Pesta",
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  belum_dp: "Belum Bayar DP",
  belum_lunas: "Belum Lunas",
  lunas: "Lunas",
}

export const APPROVAL_LABEL: Record<BookingApprovalStatus, string> = {
  diajukan: "Menunggu keputusan",
  menunggu_konfirmasi: "Perlu dikonfirmasi",
  diterima: "Diterima",
  ditolak: "Ditolak",
}

export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function todayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function daysUntil(iso: string) {
  const today = new Date(`${todayISO()}T00:00:00`).getTime()
  const target = new Date(`${iso}T00:00:00`).getTime()
  return Math.round((target - today) / 86_400_000)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`))
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T12:00:00`))
}

export function formatTime(time: string) {
  return time.replace(":", ".")
}

/** Tampilkan ISO `YYYY-MM-DD` sebagai `DD/MM/YYYY` agar mudah diketik. */
export function formatDateInput(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) return iso
  return `${match[3]}/${match[2]}/${match[1]}`
}

/**
 * Terima ketikan manual: `22/10/2026`, `22-10-2026`, `2026-10-22`,
 * atau digit saja `22102026` (umum di keypad HP).
 * Mengembalikan ISO `YYYY-MM-DD` atau null jika tidak valid.
 */
export function parseDateInput(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null

  let year = 0
  let month = 0
  let day = 0

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw)
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(raw)
  const digits = raw.replace(/\D/g, "")
  const compact = digits.length === 8 ? /^(\d{2})(\d{2})(\d{4})$/.exec(digits) : null
  if (iso) {
    year = Number(iso[1])
    month = Number(iso[2])
    day = Number(iso[3])
  } else if (dmy) {
    day = Number(dmy[1])
    month = Number(dmy[2])
    year = Number(dmy[3])
  } else if (compact) {
    day = Number(compact[1])
    month = Number(compact[2])
    year = Number(compact[3])
  } else {
    return null
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Format ketikan digit jadi `DD/MM/YYYY` agar mudah di keypad HP. */
export function maskDateDigits(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * Terima ketikan manual: `8.00`, `08.00`, `8:00`, `08:00`.
 * Mengembalikan `HH:mm` atau null jika tidak valid.
 */
export function parseTimeInput(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  const match = /^(\d{1,2})[:.](\d{2})$/.exec(raw)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`))
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

export function dpFor(price: number) {
  return Math.round((price * 0.3) / 1000) * 1000
}

export function invoiceNo(date: string, id: string) {
  return `RJ-${date.replaceAll("-", "")}-${id.slice(0, 4).toUpperCase()}`
}

export function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "")
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits
  const target = normalized ? `https://wa.me/${normalized}` : "https://wa.me/"
  return `${target}?text=${encodeURIComponent(text)}`
}
