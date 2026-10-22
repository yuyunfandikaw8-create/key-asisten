"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { attireById, packageById, studio } from "@/lib/catalog"
import {
  EVENT_LABEL,
  formatDate,
  formatShortDate,
  formatTime,
  invoiceNo,
  rupiah,
  waLink,
} from "@/lib/format"
import {
  buildInvoicePdf,
  downloadPdfBlob,
  invoicePdfFilename,
  shareOrDownloadInvoicePdf,
} from "@/lib/invoice-pdf"
import { balance, paymentStatus } from "@/lib/metrics"

type LineItem = {
  label: string
  detail?: string
  qty: number
  price: number
}

export function InvoiceDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { ready, city, bookings, updateBooking, removeBooking } = useStudio()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfNotice, setPdfNotice] = useState("")

  if (!ready) return <StudioLoading />

  const found = bookings.find((item) => item.id === params.id)
  if (!found) {
    return (
      <EmptyState
        title="Invoice tidak ditemukan"
        body="Tagihan ini tidak ada di browser ini. Mungkin sudah dihapus, atau data contoh baru saja dikembalikan."
      />
    )
  }
  const booking = found

  const pkg = packageById(booking.packageId)
  const attire = attireById(booking.attireId)
  const due = balance(booking)
  const number = invoiceNo(booking.date, booking.id)
  const filename = invoicePdfFilename(number, booking.clientName)
  const lines: LineItem[] = [
    {
      label: pkg?.name ?? "Paket rias",
      detail: `${EVENT_LABEL[booking.eventType]} · ${formatTime(booking.time)} · ${booking.location}`,
      qty: 1,
      price: booking.price,
    },
  ]
  if (attire) {
    lines.push({
      label: `Sewa ${attire.name}`,
      detail: `${attire.category} · ukuran ${attire.size}`,
      qty: 1,
      price: 0,
    })
  }

  const message = [
    `Halo ${booking.clientName}, ini invoice ${studio.name} dalam bentuk PDF.`,
    number,
    `${EVENT_LABEL[booking.eventType]} · ${formatDate(booking.date)} pukul ${formatTime(booking.time)}`,
    booking.location,
    `Total ${rupiah(booking.price)}`,
    `Sudah dibayar ${rupiah(booking.paid)}`,
    `Sisa ${rupiah(due)}`,
    `Transfer ke ${studio.bank} a.n. ${studio.accountName} ${studio.accountNumber}`,
  ].join("\n")

  const waFallbackMessage = [
    message,
    "",
    "File PDF invoice sudah diunduh di perangkat kamu. Lampirkan file tersebut di chat WhatsApp ini.",
  ].join("\n")

  function makePdfBlob() {
    return buildInvoicePdf({
      booking,
      number,
      city,
      lines,
      due,
    })
  }

  async function downloadPdf() {
    setPdfBusy(true)
    setPdfNotice("")
    try {
      downloadPdfBlob(makePdfBlob(), filename)
      setPdfNotice("PDF invoice siap diunduh.")
    } catch {
      setPdfNotice("Gagal membuat PDF. Coba lagi.")
    } finally {
      setPdfBusy(false)
    }
  }

  async function sendWhatsAppPdf() {
    setPdfBusy(true)
    setPdfNotice("")
    try {
      const blob = makePdfBlob()
      const result = await shareOrDownloadInvoicePdf({
        blob,
        filename,
        title: `Invoice ${number}`,
        text: message,
      })
      if (result === "shared") {
        setPdfNotice("Pilih WhatsApp di menu bagikan, lalu kirim PDF ke customer.")
        return
      }
      setPdfNotice("PDF diunduh. Lampirkan file itu di chat WhatsApp yang terbuka.")
      window.open(waLink(booking.phone, waFallbackMessage), "_blank", "noopener,noreferrer")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setPdfNotice("Pengiriman dibatalkan.")
        return
      }
      setPdfNotice("Gagal menyiapkan PDF. Coba unduh PDF dulu, lalu kirim manual lewat WhatsApp.")
    } finally {
      setPdfBusy(false)
    }
  }

  function record(nextPaid: number) {
    const paid = Math.min(Math.max(nextPaid, 0), booking!.price)
    updateBooking(booking!.id, { paid })
    setOpen(false)
    setError("")
  }

  return (
    <div className="grid gap-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => router.push("/studio/invoice")}>
          Semua invoice
        </Button>
        <Button onClick={() => window.print()}>Cetak</Button>
        <Button variant="outline" disabled={pdfBusy} onClick={() => void downloadPdf()}>
          Unduh PDF
        </Button>
        <Button disabled={pdfBusy} onClick={() => void sendWhatsAppPdf()}>
          {pdfBusy ? "Menyiapkan PDF…" : "Kirim WhatsApp (PDF)"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Catat bayar
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            removeBooking(booking.id)
            router.push("/studio/invoice")
          }}
        >
          Hapus
        </Button>
        <StatusBadge status={paymentStatus(booking)} />
      </div>
      {pdfNotice ? (
        <p className="no-print rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          {pdfNotice}
        </p>
      ) : (
        <p className="no-print text-xs text-muted-foreground">
          Kirim WhatsApp akan membuat PDF invoice. Di HP, pilih WhatsApp dari menu bagikan. Di
          komputer, PDF diunduh dulu lalu dilampirkan di chat.
        </p>
      )}

      <div className="no-print grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="invoice-tanggal">Tanggal jadwal</Label>
          <Input
            id="invoice-tanggal"
            type="date"
            value={booking.date}
            onChange={(event) => {
              const next = event.target.value
              if (!next) return
              updateBooking(booking.id, { date: next })
            }}
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="invoice-jam">Jam</Label>
          <Input
            id="invoice-jam"
            type="time"
            value={booking.time}
            onChange={(event) => {
              const next = event.target.value
              if (!next) return
              updateBooking(booking.id, { time: next })
            }}
            className="h-10"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Ubah tanggal atau jam di sini — jadwal dan isi invoice ikut berubah.
        </p>
      </div>

      <article className="invoice-sheet mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] bg-white text-[oklch(0.32_0.03_40)] shadow-sm ring-1 ring-[oklch(0.88_0.03_20)]">
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
          >
            <div className="flex size-52 items-center justify-center rounded-full border-[10px] border-[oklch(0.72_0.06_15)] font-display text-7xl font-semibold tracking-tight text-[oklch(0.48_0.1_15)]">
              K
            </div>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase">Issued to</p>
                <p className="mt-2 text-lg font-semibold">
                  {booking.clientName}
                  <span className="font-medium text-[oklch(0.48_0.03_30)]">
                    {" "}
                    · ({city || studio.city})
                  </span>
                </p>
                <p className="text-sm text-[oklch(0.48_0.03_30)]">
                  {booking.phone || "Nomor belum diisi"}
                </p>
              </div>
              <div className="h-px bg-[oklch(0.9_0.02_20)]" />
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase">Issued by</p>
                <p className="mt-2 text-base font-semibold">
                  {studio.owner} · {studio.instagram}
                </p>
                <p className="text-sm text-[oklch(0.48_0.03_30)]">{studio.phone}</p>
                <p className="text-sm text-[oklch(0.48_0.03_30)]">
                  {studio.name} · {studio.city}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <h1 className="font-display text-5xl font-semibold tracking-tight text-[oklch(0.3_0.04_25)] sm:text-6xl">
                Invoice
              </h1>
              <div className="mt-4 inline-grid gap-1 rounded-[1.25rem] bg-[oklch(0.94_0.03_15)] px-4 py-3 text-left text-sm sm:ml-auto">
                <p>
                  <span className="text-[oklch(0.5_0.03_25)]">Invoice Number</span>
                  <span className="mt-0.5 block font-semibold">{number}</span>
                </p>
                <p className="mt-2">
                  <span className="text-[oklch(0.5_0.03_25)]">Date</span>
                  <span className="mt-0.5 block font-semibold">{formatShortDate(booking.date)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-10 grid gap-3">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_0.5fr_0.8fr_0.8fr] gap-2 rounded-full bg-[oklch(0.93_0.035_15)] px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase sm:grid">
              <span>Item description</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total</span>
            </div>
            {lines.map((line) => (
              <div
                key={line.label}
                className="rounded-[1.4rem] bg-[oklch(0.95_0.025_15)] px-4 py-4 text-sm sm:grid sm:grid-cols-[minmax(0,1.6fr)_0.5fr_0.8fr_0.8fr] sm:items-center sm:gap-2 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium">{line.label}</p>
                  {line.detail ? (
                    <p className="mt-1 text-xs text-[oklch(0.5_0.03_30)]">{line.detail}</p>
                  ) : null}
                </div>
                <div className="mt-3 flex justify-between gap-3 text-sm sm:mt-0 sm:contents">
                  <p className="sm:text-center">
                    <span className="text-[oklch(0.5_0.03_30)] sm:hidden">Qty · </span>
                    {line.qty}
                  </p>
                  <p className="sm:text-right">
                    <span className="text-[oklch(0.5_0.03_30)] sm:hidden">Price · </span>
                    {line.price ? rupiah(line.price) : "Termasuk"}
                  </p>
                  <p className="font-medium sm:text-right">
                    <span className="font-normal text-[oklch(0.5_0.03_30)] sm:hidden">Total · </span>
                    {line.price ? rupiah(line.price * line.qty) : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase">Pay to</p>
              <p className="mt-2 font-semibold">{studio.bank}</p>
              <p className="text-sm">
                {studio.accountName} · {studio.accountNumber}
              </p>
              {booking.notes ? (
                <p className="mt-3 max-w-sm text-sm text-[oklch(0.48_0.03_30)]">{booking.notes}</p>
              ) : null}
            </div>
            <div className="grid min-w-[14rem] gap-2 text-sm sm:text-right">
              <div className="flex justify-between gap-8 sm:justify-end">
                <span className="text-[oklch(0.48_0.03_30)]">Sub-Total</span>
                <span className="font-medium">{rupiah(booking.price)}</span>
              </div>
              <div className="flex justify-between gap-8 sm:justify-end">
                <span className="text-[oklch(0.48_0.03_30)]">Down Payment (DP)</span>
                <span className="font-medium">{rupiah(booking.paid)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-6 rounded-[1.35rem] bg-[oklch(0.9_0.04_15)] px-4 py-3 text-base font-semibold">
                <span>Total</span>
                <span>{rupiah(due)}</span>
              </div>
              {due === 0 ? (
                <p className="text-xs text-[oklch(0.5_0.03_30)]">Lunas</p>
              ) : null}
            </div>
          </div>
        </div>

        <footer className="bg-[oklch(0.93_0.035_15)] px-6 py-4 text-center text-sm font-medium tracking-[0.14em] uppercase text-[oklch(0.38_0.05_20)] sm:px-10">
          WhatsApp {studio.phone} · {studio.city}
        </footer>
      </article>

      <p className="no-print text-center text-xs text-muted-foreground">
        <Link href={`/p/${studio.slug}`} className="text-primary hover:underline">
          Pricelist publik {studio.name}
        </Link>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat pembayaran</DialogTitle>
            <DialogDescription>
              Sisa tagihan {rupiah(due)}. DP standar untuk jadwal ini {rupiah(booking.dp)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="jumlah">Jumlah diterima</Label>
            <Input
              id="jumlah"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1500000"
              className="h-10"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => record(booking.dp)}>
              Tandai DP
            </Button>
            <Button variant="outline" onClick={() => record(booking.price)}>
              Tandai lunas
            </Button>
            <Button
              onClick={() => {
                const value = Number(amount.replace(/\D/g, ""))
                if (!value) {
                  setError("Isi jumlah yang diterima.")
                  return
                }
                record(booking.paid + value)
              }}
            >
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
