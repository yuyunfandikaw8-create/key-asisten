import { studio } from "@/lib/catalog"
import { formatDate, formatTime, rupiah } from "@/lib/format"
import type { Booking } from "@/lib/types"

export const BOOKING_INBOX_KEY = "key-assistant.booking-inbox.v1"
export const BOOKING_ALERT_EVENT = "ka-booking-alert"
export const NOTIF_PREF_KEY = "key-assistant.owner-notif.v1"

export type BookingAlertPayload = {
  slug: string
  booking: Booking
}

type InboxMap = Record<string, Booking[]>

function readInbox(): InboxMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(BOOKING_INBOX_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as InboxMap
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeInbox(map: InboxMap) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(BOOKING_INBOX_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

/** Sisipkan ke semua studio lokal owner di perangkat ini (kunci email). */
function mergeIntoLocalOwnerStudios(booking: Booking) {
  if (typeof window === "undefined") return
  const prefix = "key-assistant.studio.v3:email:"
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as { bookings?: Booking[] }
      if (!Array.isArray(parsed.bookings)) continue
      if (parsed.bookings.some((item) => item.id === booking.id)) continue
      parsed.bookings = [booking, ...parsed.bookings]
      localStorage.setItem(key, JSON.stringify(parsed))
    } catch {
      // ignore corrupt rows
    }
  }
}

/** Antrian pengajuan per slug — dibaca owner saat buka studio di perangkat yang sama. */
export function enqueuePublicBooking(slug: string, booking: Booking) {
  const key = slug.trim().toLowerCase() || studio.slug
  const map = readInbox()
  const list = Array.isArray(map[key]) ? map[key] : []
  if (list.some((item) => item.id === booking.id)) return
  map[key] = [booking, ...list].slice(0, 100)
  writeInbox(map)
  mergeIntoLocalOwnerStudios(booking)
  broadcastBookingAlert({ slug: key, booking })
  // Notifikasi sistem hanya ditampilkan di sesi owner (studio), bukan di HP klien.
}

/** Ambil & kosongkan antrian untuk slug (dipanggil studio owner). */
export function consumePublicBookings(slug: string): Booking[] {
  const key = slug.trim().toLowerCase() || studio.slug
  const map = readInbox()
  const list = Array.isArray(map[key]) ? map[key] : []
  if (!list.length) return []
  map[key] = []
  writeInbox(map)
  return list
}

export function peekPublicBookings(slug: string): Booking[] {
  const key = slug.trim().toLowerCase() || studio.slug
  const map = readInbox()
  return Array.isArray(map[key]) ? map[key] : []
}

function broadcastBookingAlert(payload: BookingAlertPayload) {
  if (typeof window === "undefined") return
  try {
    window.dispatchEvent(new CustomEvent(BOOKING_ALERT_EVENT, { detail: payload }))
  } catch {
    // ignore
  }
  try {
    const channel = new BroadcastChannel(BOOKING_ALERT_EVENT)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // ignore older browsers
  }
  // storage event untuk tab lain (nilai harus berubah)
  try {
    localStorage.setItem(
      `${BOOKING_INBOX_KEY}:ping`,
      JSON.stringify({ at: Date.now(), id: payload.booking.id })
    )
  } catch {
    // ignore
  }
}

export function ownerNotificationsEnabled() {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(NOTIF_PREF_KEY) === "1"
  } catch {
    return false
  }
}

export function setOwnerNotificationsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(NOTIF_PREF_KEY, enabled ? "1" : "0")
  } catch {
    // ignore
  }
}

export async function requestOwnerNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported"
  }
  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission()
  setOwnerNotificationsEnabled(permission === "granted")
  return permission
}

export function bookingAlertTitle(booking: Booking) {
  return `Pengajuan booking · ${booking.clientName}`
}

export function bookingAlertBody(booking: Booking) {
  const paket = booking.packageName?.trim() || "Paket"
  return `${paket} · ${formatDate(booking.date)} ${formatTime(booking.time)} · ${rupiah(booking.price)}`
}

export async function showBookingNotification(booking: Booking) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false
  if (Notification.permission !== "granted") return false
  const title = bookingAlertTitle(booking)
  const body = bookingAlertBody(booking)
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        tag: `booking-${booking.id}`,
        data: { url: "/studio/jadwal?status=pengajuan", bookingId: booking.id },
      })
      return true
    }
  } catch {
    // fall through to page Notification
  }
  try {
    const notif = new Notification(title, {
      body,
      tag: `booking-${booking.id}`,
    })
    notif.onclick = () => {
      window.focus()
      window.location.href = "/studio/jadwal?status=pengajuan"
      notif.close()
    }
    return true
  } catch {
    return false
  }
}

export function subscribeBookingAlerts(onAlert: (payload: BookingAlertPayload) => void) {
  if (typeof window === "undefined") return () => {}

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<BookingAlertPayload>).detail
    if (detail?.booking) onAlert(detail)
  }
  window.addEventListener(BOOKING_ALERT_EVENT, onCustom)

  let channel: BroadcastChannel | null = null
  try {
    channel = new BroadcastChannel(BOOKING_ALERT_EVENT)
    channel.onmessage = (event) => {
      const data = event.data as BookingAlertPayload
      if (data?.booking) onAlert(data)
    }
  } catch {
    channel = null
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== `${BOOKING_INBOX_KEY}:ping` || !event.newValue) return
    // Owner tab lain: tarik antrian slug studio
    const pending = peekPublicBookings(studio.slug)
    const latest = pending[0]
    if (latest) onAlert({ slug: studio.slug, booking: latest })
  }
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(BOOKING_ALERT_EVENT, onCustom)
    window.removeEventListener("storage", onStorage)
    try {
      channel?.close()
    } catch {
      // ignore
    }
  }
}
