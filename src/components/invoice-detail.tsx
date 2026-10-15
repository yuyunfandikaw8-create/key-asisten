"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
  formatTime,
  invoiceNo,
  rupiah,
  waLink,
} from "@/lib/format"
import { balance, paymentStatus } from "@/lib/metrics"

export function InvoiceDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { ready, bookings, updateBooking, removeBooking } = useStudio()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")

  if (!ready) return <StudioLoading />

  const booking = bookings.find((item) => item.id === params.id)
  if (!booking) {
    return (
      <EmptyState
        title="Invoice tidak ditemukan"
        body="Tagihan ini tidak ada di browser ini. Mungkin sudah dihapus, atau data contoh baru saja dikembalikan."
      />
    )
  }

  const pkg = packageById(booking.packageId)
  const attire = attireById(booking.attireId)
  const due = balance(booking)
  const message = [
    `Halo ${booking.clientName}, ini invoice ${studio.name}.`,
    invoiceNo(booking.date, booking.id),
    `${EVENT_LABEL[booking.eventType]} · ${formatDate(booking.date)} pukul ${formatTime(booking.time)}`,
    booking.location,
    `Total ${rupiah(booking.price)}`,
    `Sudah dibayar ${rupiah(booking.paid)}`,
    `Sisa ${rupiah(due)}`,
  ].join("\n")

  function record(nextPaid: number) {
    const paid = Math.min(Math.max(nextPaid, 0), booking!.price)
    updateBooking(booking!.id, { paid })
    setOpen(false)
    setError("")
  }

  return (
    <div className="grid gap-4">
      <div className="no-print flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => router.push("/studio/invoice")}>
          Semua invoice
        </Button>
        <Button onClick={() => window.print()}>Cetak</Button>
        <a
          className={cn(buttonVariants({ variant: "outline" }))}
          href={waLink(booking.phone, message)}
          target="_blank"
          rel="noreferrer"
        >
          Kirim WhatsApp
        </a>
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
      </div>

      <article className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{studio.name}</p>
            <h1 className="text-4xl">{invoiceNo(booking.date, booking.id)}</h1>
          </div>
          <StatusBadge status={paymentStatus(booking)} />
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Klien</dt>
            <dd className="font-medium">{booking.clientName}</dd>
            <dd>{booking.phone || "Nomor belum ada"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Acara</dt>
            <dd className="font-medium">{EVENT_LABEL[booking.eventType]}</dd>
            <dd>
              {formatDate(booking.date)} · {formatTime(booking.time)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Lokasi</dt>
            <dd>{booking.location}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Paket</dt>
            <dd>{pkg?.name ?? "Paket dihapus"}</dd>
            <dd>{attire ? attire.name : "Tanpa gaun studio"}</dd>
          </div>
        </dl>
        <div className="mt-6 grid gap-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <span>{rupiah(booking.price)}</span>
          </div>
          <div className="flex justify-between">
            <span>DP yang diminta</span>
            <span>{rupiah(booking.dp)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sudah dibayar</span>
            <span>{rupiah(booking.paid)}</span>
          </div>
          <div className="flex justify-between text-base font-medium">
            <span>Sisa</span>
            <span>{rupiah(due)}</span>
          </div>
        </div>
        {booking.notes ? <p className="mt-4 text-sm text-muted-foreground">{booking.notes}</p> : null}
        <p className="mt-6 text-xs text-muted-foreground">
          <Link href={`/p/${studio.slug}`}>Pricelist publik</Link>
        </p>
      </article>

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
