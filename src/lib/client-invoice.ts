import { jsPDF } from "jspdf"

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
  formatShortDate,
  invoiceNo,
  rupiah,
  todayISO,
} from "@/lib/format"
import { downloadPdfBlob } from "@/lib/invoice-pdf"

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
  paymentStatus: ClientInvoicePaymentStatus
  bookingStatus: ClientBookingStatus
  categoryLabel: string
  categoryEmoji: string
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

export function buildClientInvoice(
  event: ClientEvent,
  slot: ClientEventSlot
): ClientInvoice | null {
  if (!slot.partnerId || !BILLABLE.includes(slot.status)) return null
  const partner = partnerById(slot.partnerId)
  if (!partner) return null
  const category = categoryById(slot.needId)
  const issuedAt = issuedDateFor(event)
  const dueAt = dueDateFor(event, issuedAt)
  const seed = `${event.id}-${slot.needId}`
  return {
    id: clientInvoiceId(event.id, slot.needId),
    eventId: event.id,
    needId: slot.needId,
    vendorName: partner.name,
    eventTitle: event.title,
    number: invoiceNo(issuedAt, seed),
    issuedAt,
    dueAt,
    total: partner.share,
    paymentStatus: clientInvoicePaymentStatus(slot.status, dueAt),
    bookingStatus: slot.status,
    categoryLabel: category?.label || slot.needId,
    categoryEmoji: category?.emoji || "",
  }
}

export function listClientInvoices(events: ClientEvent[]) {
  return events.flatMap((event) =>
    event.slots
      .map((slot) => buildClientInvoice(event, slot))
      .filter((invoice): invoice is ClientInvoice => Boolean(invoice))
  )
}

export function findClientInvoice(events: ClientEvent[], id: string) {
  const parsed = parseClientInvoiceId(id)
  if (!parsed) return null
  const event = events.find((item) => item.id === parsed.eventId)
  if (!event) return null
  const slot = event.slots.find((item) => item.needId === parsed.needId)
  if (!slot) return null
  return buildClientInvoice(event, slot)
}

export function downloadClientInvoicePdf(invoice: ClientInvoice) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const margin = 16
  let y = 22
  const maroon: [number, number, number] = [120, 45, 52]
  const muted: [number, number, number] = [110, 95, 95]

  doc.setTextColor(...maroon)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("TAGIHAN", margin, y)

  y += 12
  doc.setFontSize(11)
  doc.setTextColor(40)
  doc.text(invoice.number, margin, y)

  y += 14
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...muted)
  const rows: Array<[string, string]> = [
    ["Vendor", invoice.vendorName],
    ["Acara", invoice.eventTitle],
    ["Kategori", `${invoice.categoryEmoji} ${invoice.categoryLabel}`.trim()],
    ["Tanggal terbit", formatShortDate(invoice.issuedAt)],
    ["Jatuh tempo", formatShortDate(invoice.dueAt)],
    ["Total", rupiah(invoice.total)],
    ["Status pembayaran", CLIENT_INVOICE_PAYMENT_LABEL[invoice.paymentStatus]],
  ]
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 48, y)
    y += 8
  }

  const blob = doc.output("blob")
  const filename = `Tagihan_${invoice.number.replace(/[^\w.-]+/g, "_")}.pdf`
  downloadPdfBlob(blob, filename)
}
