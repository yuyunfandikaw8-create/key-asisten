import { studio } from "@/lib/catalog"
import {
  categoryById,
  partnerById,
  type ClientBookingStatus,
  type ClientEvent,
  type ClientEventSlot,
  type ClientNeedId,
} from "@/lib/client-workspace"
import {
  addDays,
  dpFor,
  invoiceNo,
  todayISO,
} from "@/lib/format"
import {
  buildInvoicePdf,
  downloadPdfBlob,
  invoicePdfFilename,
  type InvoicePdfBrand,
} from "@/lib/invoice-pdf"
import { TRADE_LABEL, type Partner } from "@/lib/partners"
import type { Booking } from "@/lib/types"

export type ClientInvoicePaymentStatus =
  | "belum_dibayar"
  | "menunggu_konfirmasi"
  | "dibayar"
  | "terlambat"

export const CLIENT_INVOICE_PAYMENT_LABEL: Record<
  ClientInvoicePaymentStatus,
  string
> = {
  belum_dibayar: "Belum Dibayar",
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  dibayar: "Dibayar",
  terlambat: "Terlambat",
}

export type ClientProfileInput = {
  name?: string
  phone?: string
  city?: string
}

export type ClientInvoice = {
  id: string
  eventId: string
  needId: ClientNeedId
  vendorName: string
  eventTitle: string
  number: string
  issuedAt: string
  dueAt: string
  total: number
  paid: number
  paymentStatus: ClientInvoicePaymentStatus
  bookingStatus: ClientBookingStatus
  categoryLabel: string
  categoryEmoji: string
  partner: Partner
  event: ClientEvent
  client: ClientProfileInput
}

const BILLABLE: ClientBookingStatus[] = [
  "menunggu_dp",
  "sudah_dp",
  "menunggu_pelunasan",
  "lunas",
  "selesai",
]

export function clientInvoiceId(eventId: string, needId: ClientNeedId) {
  return `${eventId}--${needId}`
}

export function parseClientInvoiceId(id: string) {
  const separator = id.indexOf("--")
  if (separator <= 0) return null
  const eventId = id.slice(0, separator)
  const needId = id.slice(separator + 2) as ClientNeedId
  if (!eventId || !needId) return null
  return { eventId, needId }
}

function issuedDateFor(event: ClientEvent) {
  if (event.createdAt?.slice(0, 10)) return event.createdAt.slice(0, 10)
  if (event.date) return event.date
  return todayISO()
}

function dueDateFor(event: ClientEvent, issuedAt: string) {
  if (event.date) return event.date
  return addDays(issuedAt, 14)
}

export function clientInvoicePaymentStatus(
  status: ClientBookingStatus,
  dueAt: string
): ClientInvoicePaymentStatus {
  if (status === "lunas" || status === "selesai") return "dibayar"
  if (status === "sudah_dp") return "menunggu_konfirmasi"
  if (dueAt < todayISO()) return "terlambat"
  return "belum_dibayar"
}

function paidForStatus(status: ClientBookingStatus, price: number, dp: number) {
  if (status === "lunas" || status === "selesai") return price
  if (status === "sudah_dp" || status === "menunggu_pelunasan") return dp
  return 0
}

export function buildClientInvoice(
  event: ClientEvent,
  slot: ClientEventSlot,
  client: ClientProfileInput = {}
): ClientInvoice | null {
  if (!slot.partnerId || !BILLABLE.includes(slot.status)) return null
  const partner = partnerById(slot.partnerId)
  if (!partner) return null
  const category = categoryById(slot.needId)
  const issuedAt = issuedDateFor(event)
  const dueAt = dueDateFor(event, issuedAt)
  const seed = `${event.id}-${slot.needId}`
  const total = partner.share
  const dp = dpFor(total)
  return {
    id: clientInvoiceId(event.id, slot.needId),
    eventId: event.id,
    needId: slot.needId,
    vendorName: partner.name,
    eventTitle: event.title,
    number: invoiceNo(event.date || issuedAt, seed),
    issuedAt,
    dueAt,
    total,
    paid: paidForStatus(slot.status, total, dp),
    paymentStatus: clientInvoicePaymentStatus(slot.status, dueAt),
    bookingStatus: slot.status,
    categoryLabel: category?.label || slot.needId,
    categoryEmoji: category?.emoji || "",
    partner,
    event,
    client,
  }
}

export function listClientInvoices(
  events: ClientEvent[],
  client: ClientProfileInput = {}
) {
  return events.flatMap((event) =>
    event.slots
      .map((slot) => buildClientInvoice(event, slot, client))
      .filter((invoice): invoice is ClientInvoice => Boolean(invoice))
  )
}

export function findClientInvoice(
  events: ClientEvent[],
  id: string,
  client: ClientProfileInput = {}
) {
  const parsed = parseClientInvoiceId(id)
  if (!parsed) return null
  const event = events.find((item) => item.id === parsed.eventId)
  if (!event) return null
  const slot = event.slots.find((item) => item.needId === parsed.needId)
  if (!slot) return null
  return buildClientInvoice(event, slot, client)
}

/** Susun booking + brand seperti invoice owner, lalu unduh PDF yang sama. */
export function downloadClientInvoicePdf(invoice: ClientInvoice) {
  const partner = invoice.partner
  const event = invoice.event
  const price = invoice.total
  const dp = dpFor(price)
  const paid = invoice.paid
  const due = Math.max(price - paid, 0)
  const bookingDate = event.date || invoice.issuedAt
  const bookingId = `${event.id}-${invoice.needId}`
  const packageLabel = `${invoice.categoryLabel} — ${
    partner.offer || TRADE_LABEL[partner.trade] || partner.name
  }`

  const booking: Booking = {
    id: bookingId,
    clientName: invoice.client.name?.trim() || "Klien",
    phone: invoice.client.phone?.trim() || "",
    eventType: "pengantin",
    eventLabel: event.title,
    date: bookingDate,
    time: "08:00",
    location: event.location || event.city || partner.city,
    packageId: "custom",
    packageName: packageLabel,
    attireId: null,
    price,
    dp,
    paid,
    notes: "",
    source: "pricelist",
    attireReturned: false,
    createdAt: event.createdAt || `${invoice.issuedAt}T12:00:00.000Z`,
    invoicePaymentMethods: ["transfer", "qris"],
  }

  const brand: InvoicePdfBrand = {
    name: partner.name,
    owner: partner.name,
    phone: partner.phone,
    city: partner.city,
    bank: studio.bank,
    accountName: partner.name,
    accountNumber: studio.accountNumber,
    ewalletName: "",
    ewalletNumber: "",
    instagram: undefined,
    paymentMethods: ["transfer", "qris"],
  }

  const lines = [
    {
      label: packageLabel,
      detail: `${event.title} · ${event.location || event.city || partner.city}`,
      qty: 1,
      price,
    },
  ]

  const blob = buildInvoicePdf({
    booking,
    number: invoice.number,
    city: invoice.client.city?.trim() || event.city || partner.city,
    lines,
    due,
    brand,
  })
  downloadPdfBlob(blob, invoicePdfFilename(invoice.number, booking.clientName))
}
