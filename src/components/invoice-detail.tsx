"use client"

import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { ScheduleFields } from "@/components/schedule-fields"
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
import {
  attireById,
  bookingAttireName,
  bookingEventLabel,
  bookingPackageName,
  studio,
} from "@/lib/catalog"
import {
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
import {
  PAYMENT_METHOD_OPTIONS,
  paymentMethodLabel,
  resolveInvoicePaymentMethods,
  type PaymentMethodId,
} from "@/lib/auth"
import { balance, paymentStatus } from "@/lib/metrics"
import { studioBrand } from "@/lib/studio-brand"
import { cn } from "@/lib/utils"

type LineItem = {
  label: string
  detail?: string
  qty: number
  price: number
}

export function InvoiceDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { ready, city, bookings, updateBooking, removeBooking, viewMode } = useStudio()
  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfNotice, setPdfNotice] = useState("")
  const openPay = searchParams.get("bayar") === "1"

  useEffect(() => {
    if (!ready) return
    if (openPay) setOpen(true)
  }, [openPay, ready])

  if (!ready) return <StudioLoading />

  const found = bookings.find((item) => item.id === params.id)
  if (!found) {
    return (
      <EmptyState
        title="Invoice tidak ditemukan"
        body="Invoice ini tidak ada di browser ini. Mungkin sudah dihapus, atau data contoh baru saja dikembalikan."
      />
    )
  }
  const booking = found

  const attire = attireById(booking.attireId)
  const attireLabel = bookingAttireName(booking)
  const due = balance(booking)
  const number = invoiceNo(booking.date, booking.id)
  const filename = invoicePdfFilename(number, booking.clientName)
  const lines: LineItem[] = [
    {
      label: bookingPackageName(booking),
      detail: `${bookingEventLabel(booking)} · ${formatTime(booking.time)} · ${booking.location}`,
      qty: 1,
      price: booking.price,
    },
  ]
  if (attireLabel) {
    lines.push({
      label: `Sewa ${attireLabel}`,
      detail: attire
        ? `${attire.category} · ukuran ${attire.size}`
        : "Gaun / wardrobe",
      qty: 1,
      price: 0,
    })
  }

  const availableMethods = brand.payment.methods
  const invoiceMethods = resolveInvoicePaymentMethods(
    booking.invoicePaymentMethods,
    availableMethods
  )

  const payLines: string[] = []
  if (invoiceMethods.includes("transfer")) {
    payLines.push(
      `Transfer ke ${brand.bank} a.n. ${brand.accountName} ${brand.accountNumber}`
    )
  }
  if (invoiceMethods.includes("qris")) payLines.push("Bisa bayar via QRIS (lihat invoice)")
  if (invoiceMethods.includes("ewallet")) {
    payLines.push(
      brand.ewalletName && brand.ewalletNumber
        ? `E-Wallet ${brand.ewalletName} ${brand.ewalletNumber}`
        : "E-Wallet diterima"
    )
  }
  if (invoiceMethods.includes("cash")) payLines.push("Tunai diterima")

  const message = [
    `Halo ${booking.clientName}, ini invoice ${brand.name} dalam bentuk PDF.`,
    number,
    `${bookingEventLabel(booking)} · ${formatDate(booking.date)} pukul ${formatTime(booking.time)}`,
    booking.location,
    `Total ${rupiah(booking.price)}`,
    `Sudah dibayar ${rupiah(booking.paid)}`,
    `Sisa ${rupiah(due)}`,
    ...payLines,
  ].join("\n")

  const waFallbackMessage = [
    message,
    "",
    "File PDF invoice sudah diunduh di perangkat kamu. Lampirkan file tersebut di chat WhatsApp ini.",
  ].join("\n")

  function toggleInvoiceMethod(id: PaymentMethodId) {
    const current = resolveInvoicePaymentMethods(
      booking.invoicePaymentMethods,
      availableMethods
    )
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    if (!next.length) return
    updateBooking(booking.id, { invoicePaymentMethods: next })
  }

  function makePdfBlob() {
    return buildInvoicePdf({
      booking,
      number,
      city,
      lines,
      due,
      brand: {
        name: brand.name,
        owner: brand.owner,
        phone: brand.phone,
        city: brand.city,
        bank: brand.bank,
        accountName: brand.accountName,
        accountNumber: brand.accountNumber,
        ewalletName: brand.ewalletName,
        ewalletNumber: brand.ewalletNumber,
        instagram: brand.instagram,
        paymentMethods: invoiceMethods,
        qrisDataUrl: brand.payment.qrisDataUrl,
      },
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
    setAmount("")
    setOpen(false)
    setError("")
  }

  const typedAmount = Number(amount.replace(/\D/g, "")) || 0
  const previewDue =
    typedAmount > 0
      ? Math.max(booking.price - Math.min(booking.paid + typedAmount, booking.price), 0)
      : due

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
          {pdfBusy ? "Menyiapkan PDF…" : "Kirim ke WhatsApp"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Catat Pembayaran
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

      <div className="no-print rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <ScheduleFields
          date={booking.date}
          time={booking.time}
          dateId="invoice-tanggal"
          timeId="invoice-jam"
          onDateChange={(next) => updateBooking(booking.id, { date: next })}
          onTimeChange={(next) => updateBooking(booking.id, { time: next })}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Ketik tanggal dan jam manual — jadwal serta isi invoice ikut berubah.
        </p>
      </div>

      <div className="no-print grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div>
          <p className="font-medium">Metode pembayaran di invoice</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih metode yang mau ditampilkan ke klien. Atur rekening/QRIS di{" "}
            <Link href="/studio/keuangan" className="text-primary hover:underline">
              Keuangan
            </Link>
            .
          </p>
        </div>
        {availableMethods.length === 0 ? (
          <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
            Belum ada metode aktif. Centang metode di Keuangan dulu.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHOD_OPTIONS.filter((option) =>
              availableMethods.includes(option.id)
            ).map((option) => {
              const checked = invoiceMethods.includes(option.id)
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ring-1 transition",
                    checked
                      ? "bg-primary/8 ring-primary"
                      : "bg-background ring-foreground/10 hover:bg-muted/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInvoiceMethod(option.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              )
            })}
          </div>
        )}
        {invoiceMethods.length ? (
          <p className="text-xs text-muted-foreground">
            Tampil di invoice:{" "}
            {invoiceMethods.map((id) => paymentMethodLabel(id)).join(" · ")}
          </p>
        ) : null}
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
                    · ({city || brand.city})
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
                  {brand.owner}
                  {brand.instagram ? ` · ${brand.instagram}` : null}
                </p>
                <p className="text-sm text-[oklch(0.48_0.03_30)]">{brand.phone}</p>
                <p className="text-sm text-[oklch(0.48_0.03_30)]">
                  {brand.name} · {brand.city}
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
              {!invoiceMethods.length ? (
                <p className="mt-2 text-sm text-[oklch(0.48_0.03_30)]">
                  Belum ada metode pembayaran dipilih.
                </p>
              ) : null}
              {invoiceMethods.includes("transfer") ? (
                <div className="mt-2">
                  <p className="text-sm font-medium">Transfer Bank</p>
                  <p className="font-semibold">{brand.bank}</p>
                  <p className="text-sm">
                    {brand.accountName} · {brand.accountNumber}
                  </p>
                </div>
              ) : null}
              {invoiceMethods.includes("qris") ? (
                <div className="mt-3">
                  <p className="text-sm font-medium">QRIS</p>
                  {brand.payment.qrisDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.payment.qrisDataUrl}
                      alt="QRIS pembayaran"
                      className="mt-2 size-36 rounded-xl object-cover ring-1 ring-foreground/10"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-[oklch(0.48_0.03_30)]">
                      Gambar QRIS belum diunggah di Keuangan.
                    </p>
                  )}
                </div>
              ) : null}
              {invoiceMethods.includes("ewallet") ? (
                <p className="mt-2 text-sm">
                  {brand.ewalletName && brand.ewalletNumber
                    ? `E-Wallet ${brand.ewalletName} · ${brand.ewalletNumber}`
                    : "E-Wallet diterima"}
                </p>
              ) : null}
              {invoiceMethods.includes("cash") ? (
                <p className="mt-2 text-sm">Tunai diterima</p>
              ) : null}
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
                <span className="font-medium">{rupiah(booking.dp)}</span>
              </div>
              <div className="flex justify-between gap-8 sm:justify-end">
                <span className="text-[oklch(0.48_0.03_30)]">Sudah dibayar</span>
                <span className="font-medium">{rupiah(booking.paid)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-6 rounded-[1.35rem] bg-[oklch(0.9_0.04_15)] px-4 py-3 text-base font-semibold">
                <span>Sisa tagihan</span>
                <span>{rupiah(due)}</span>
              </div>
              {due === 0 ? (
                <p className="text-xs text-[oklch(0.5_0.03_30)]">Lunas</p>
              ) : null}
            </div>
          </div>
        </div>

        <footer className="bg-[oklch(0.93_0.035_15)] px-6 py-4 text-center text-sm font-medium tracking-[0.14em] uppercase text-[oklch(0.38_0.05_20)] sm:px-10">
          WhatsApp {brand.phone} · {brand.city}
        </footer>
      </article>

      <p className="no-print text-center text-xs text-muted-foreground">
        <Link href={`/p/${studio.slug}`} className="text-primary hover:underline">
          Pricelist publik {brand.name}
        </Link>
      </p>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setAmount("")
            setError("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Sisa tagihan:{" "}
              <span className="font-semibold text-foreground">{rupiah(previewDue)}</span>
              {typedAmount > 0 && previewDue !== due ? (
                <span className="mt-1 block text-xs">
                  Setelah pembayaran ini (harga − dibayar).
                </span>
              ) : booking.paid > 0 && booking.paid < booking.price ? (
                <span className="mt-1 block text-xs">
                  Harga {rupiah(booking.price)} − dibayar {rupiah(booking.paid)}
                  {booking.paid === booking.dp ? " (DP)" : ""}.
                </span>
              ) : booking.paid <= 0 ? (
                <span className="mt-1 block text-xs">
                  Setelah DP {rupiah(booking.dp)}, sisa menjadi{" "}
                  {rupiah(Math.max(booking.price - booking.dp, 0))}.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="jumlah">Jumlah pembayaran</Label>
            <p className="text-xs text-muted-foreground">
              Masukkan jumlah yang dibayarkan klien.
            </p>
            <Input
              id="jumlah"
              inputMode="numeric"
              value={amount}
              onChange={(event) => {
                setError("")
                const digits = event.target.value.replace(/\D/g, "")
                setAmount(digits ? Number(digits).toLocaleString("id-ID") : "")
              }}
              placeholder="Rp1.500.000"
              className="h-10"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAmount(booking.dp.toLocaleString("id-ID"))
                record(booking.dp)
              }}
            >
              Tandai sebagai DP
            </Button>
            <Button variant="outline" onClick={() => record(booking.price)}>
              Tandai Lunas
            </Button>
            <Button
              onClick={() => {
                const value = Number(amount.replace(/\D/g, ""))
                if (!value) {
                  setError("Isi jumlah pembayaran.")
                  return
                }
                record(booking.paid + value)
              }}
            >
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
