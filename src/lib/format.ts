import type { EventType, PaymentStatus } from "@/lib/types"

export const EVENT_LABEL: Record<EventType, string> = {
  pengantin: "Rias pengantin",
  akad: "Akad",
  wisuda: "Wisuda",
  engagement: "Engagement",
  prewedding: "Prewedding",
  pesta: "Pesta",
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  belum_dp: "Belum DP",
  belum_lunas: "Belum lunas",
  lunas: "Lunas",
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
