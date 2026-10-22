import { jsPDF } from "jspdf"

import { studio } from "@/lib/catalog"
import { EVENT_LABEL, formatDate, formatTime, rupiah } from "@/lib/format"
import type { Booking } from "@/lib/types"

export type InvoicePdfLine = {
  label: string
  detail?: string
  qty: number
  price: number
}

export type InvoicePdfBrand = {
  name: string
  owner: string
  phone: string
  city: string
  bank: string
  accountName: string
  accountNumber: string
  instagram?: string
}

export type InvoicePdfInput = {
  booking: Booking
  number: string
  city: string
  lines: InvoicePdfLine[]
  due: number
  brand?: InvoicePdfBrand
}

function safeFilename(value: string) {
  return value.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_")
}

export function invoicePdfFilename(number: string, clientName: string) {
  return `Invoice_${safeFilename(number)}_${safeFilename(clientName)}.pdf`
}

export function buildInvoicePdf(input: InvoicePdfInput): Blob {
  const { booking, number, city, lines, due } = input
  const brand = input.brand ?? {
    name: studio.name,
    owner: studio.owner,
    phone: studio.phone,
    city: studio.city,
    bank: studio.bank,
    accountName: studio.accountName,
    accountNumber: studio.accountNumber,
    instagram: studio.instagram,
  }
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = 18

  const maroon: [number, number, number] = [120, 45, 52]
  const muted: [number, number, number] = [110, 95, 95]
  const soft: [number, number, number] = [250, 242, 240]

  doc.setFillColor(...soft)
  doc.rect(0, 0, pageWidth, 36, "F")

  doc.setTextColor(...maroon)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("INVOICE", margin, 20)

  doc.setFontSize(11)
  doc.setTextColor(40)
  doc.text(brand.name, pageWidth - margin, 16, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...muted)
  if (brand.instagram) {
    doc.text(brand.instagram, pageWidth - margin, 22, { align: "right" })
    doc.text(brand.phone, pageWidth - margin, 27, { align: "right" })
  } else {
    doc.text(brand.owner, pageWidth - margin, 22, { align: "right" })
    doc.text(brand.phone, pageWidth - margin, 27, { align: "right" })
  }

  y = 48
  doc.setTextColor(...muted)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("ISSUED TO", margin, y)
  doc.text("INVOICE DETAIL", pageWidth / 2 + 4, y)

  y += 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(30)
  doc.text(booking.clientName, margin, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(number, pageWidth / 2 + 4, y)

  y += 5
  doc.setTextColor(...muted)
  doc.setFontSize(9)
  doc.text(booking.phone || "Nomor belum diisi", margin, y)
  doc.text(`Tanggal acara: ${formatDate(booking.date)}`, pageWidth / 2 + 4, y)

  y += 5
  doc.text(`${city || studio.city}`, margin, y)
  doc.text(`Jam: ${formatTime(booking.time)}`, pageWidth / 2 + 4, y)

  y += 5
  doc.text(`Lokasi: ${booking.location || "-"}`, pageWidth / 2 + 4, y, {
    maxWidth: contentWidth / 2 - 4,
  })

  y += 12
  doc.setFillColor(...maroon)
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "F")
  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("ITEM", margin + 3, y + 6)
  doc.text("QTY", margin + contentWidth * 0.55, y + 6)
  doc.text("HARGA", margin + contentWidth * 0.7, y + 6)
  doc.text("TOTAL", pageWidth - margin - 3, y + 6, { align: "right" })

  y += 14
  doc.setFont("helvetica", "normal")
  doc.setTextColor(30)

  for (const line of lines) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(line.label, margin, y, { maxWidth: contentWidth * 0.5 })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(String(line.qty), margin + contentWidth * 0.55, y)
    doc.text(line.price ? rupiah(line.price) : "Termasuk", margin + contentWidth * 0.7, y)
    doc.text(line.price ? rupiah(line.price * line.qty) : "—", pageWidth - margin, y, {
      align: "right",
    })
    y += 5
    if (line.detail) {
      doc.setTextColor(...muted)
      doc.setFontSize(8)
      const detailLines = doc.splitTextToSize(line.detail, contentWidth * 0.5)
      doc.text(detailLines, margin, y)
      y += detailLines.length * 4 + 4
      doc.setTextColor(30)
    } else {
      y += 4
    }
  }

  y += 4
  doc.setDrawColor(220, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  const summaryX = pageWidth / 2 + 10
  doc.setFontSize(10)
  doc.setTextColor(...muted)
  doc.text("Sub-total", summaryX, y)
  doc.setTextColor(30)
  doc.text(rupiah(booking.price), pageWidth - margin, y, { align: "right" })
  y += 6
  doc.setTextColor(...muted)
  doc.text("Sudah dibayar (DP)", summaryX, y)
  doc.setTextColor(30)
  doc.text(rupiah(booking.paid), pageWidth - margin, y, { align: "right" })
  y += 8

  doc.setFillColor(...maroon)
  doc.roundedRect(summaryX - 4, y - 5, pageWidth - margin - summaryX + 4, 12, 2, 2, "F")
  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.text(due === 0 ? "LUNAS" : "SISA TAGIHAN", summaryX, y + 3)
  doc.text(rupiah(due), pageWidth - margin - 2, y + 3, { align: "right" })

  y += 20
  doc.setTextColor(30)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Transfer ke", margin, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...muted)
  doc.text(brand.bank, margin, y)
  y += 5
  doc.text(`${brand.accountName} · ${brand.accountNumber}`, margin, y)
  y += 5
  doc.text(`Acara: ${EVENT_LABEL[booking.eventType]}`, margin, y)

  if (booking.notes) {
    y += 8
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30)
    doc.text("Catatan", margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...muted)
    const notes = doc.splitTextToSize(booking.notes, contentWidth)
    doc.text(notes, margin, y)
    y += notes.length * 4
  }

  y = Math.max(y + 16, 270)
  doc.setFillColor(...soft)
  doc.rect(0, 285, pageWidth, 12, "F")
  doc.setTextColor(...maroon)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(
    `WhatsApp ${brand.phone} · ${brand.city || city} · ${brand.name}`,
    pageWidth / 2,
    292,
    { align: "center" }
  )

  return doc.output("blob")
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

export async function shareOrDownloadInvoicePdf(input: {
  blob: Blob
  filename: string
  title: string
  text: string
}): Promise<"shared" | "downloaded"> {
  const file = new File([input.blob], input.filename, { type: "application/pdf" })
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })

  if (canShareFiles && typeof navigator.share === "function") {
    try {
      await navigator.share({
        files: [file],
        title: input.title,
        text: input.text,
      })
      return "shared"
    } catch (error) {
      // User cancelled share sheet — don't force download.
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error
      }
    }
  }

  downloadPdfBlob(input.blob, input.filename)
  return "downloaded"
}
