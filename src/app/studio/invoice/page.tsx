"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { bookingEventLabel } from "@/lib/catalog"
import {
  formatShortDate,
  formatTime,
  invoiceNo,
  rupiah,
  todayISO,
  waLink,
} from "@/lib/format"
import { balance, paymentStatus, sortBookings } from "@/lib/metrics"
import type { Booking } from "@/lib/types"
import { cn } from "@/lib/utils"

const filters = [
  { id: "semua", label: "Semua" },
  { id: "belum_bayar_dp", label: "Belum Bayar DP" },
  { id: "belum_lunas", label: "Belum Lunas" },
  { id: "lunas", label: "Lunas" },
  { id: "terlambat", label: "Terlambat" },
] as const

type InvoiceFilter = (typeof filters)[number]["id"]

function isOverdue(booking: Booking) {
  return booking.date < todayISO() && booking.paid < booking.price
}

function matchesFilter(booking: Booking, filter: InvoiceFilter) {
  const status = paymentStatus(booking)
  switch (filter) {
    case "semua":
      return true
    case "belum_bayar_dp":
      return status === "belum_dp"
    case "belum_lunas":
      return status === "belum_lunas"
    case "lunas":
      return status === "lunas"
    case "terlambat":
      return isOverdue(booking)
    default:
      return true
  }
}

export default function InvoiceListPage() {
  const { ready, bookings } = useStudio()
  const [filter, setFilter] = useState<InvoiceFilter>("semua")

  const rows = useMemo(() => sortBookings(bookings), [bookings])
  const filtered = useMemo(
    () => rows.filter((booking) => matchesFilter(booking, filter)),
    [filter, rows]
  )

  if (!ready) return <StudioLoading />

  if (rows.length === 0) {
    return (
      <div className="grid gap-5">
        <EmptyState
          title="Belum ada invoice"
          body="Invoice akan muncul setelah kamu membuat booking untuk klien."
        />
        <div className="flex justify-center">
          <Link
            href="/studio/jadwal/baru"
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-5")}
          >
            Buat Booking
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Invoice klien</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola invoice, DP, dan sisa pembayaran dalam satu tempat.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm",
              filter === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-card ring-1 ring-foreground/10"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada invoice"
          body="Belum ada booking yang sesuai dengan pilihanmu."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((booking) => {
            const due = balance(booking)
            const status = paymentStatus(booking)
            const overdue = isOverdue(booking)
            const waMessage = [
              `Halo ${booking.clientName}, pengingat invoice Key Assistant.`,
              invoiceNo(booking.date, booking.id),
              `${bookingEventLabel(booking)} · ${formatShortDate(booking.date)} ${formatTime(booking.time)}`,
              `Total ${rupiah(booking.price)}`,
              `Sudah dibayar ${rupiah(booking.paid)}`,
              `Sisa ${rupiah(due)}`,
            ].join("\n")

            return (
              <article
                key={booking.id}
                className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{booking.clientName}</p>
                      <StatusBadge status={status} />
                      {overdue ? (
                        <span className="rounded-full bg-[oklch(0.94_0.05_25)] px-2 py-0.5 text-xs text-[oklch(0.45_0.12_25)]">
                          Terlambat
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoiceNo(booking.date, booking.id)} · {formatShortDate(booking.date)} ·{" "}
                      {formatTime(booking.time)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total {rupiah(booking.price)} · Sisa {rupiah(due)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/studio/invoice/${booking.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                    >
                      Lihat Invoice
                    </Link>
                    <Link
                      href={`/studio/invoice/${booking.id}?bayar=1`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                    >
                      Catat Pembayaran
                    </Link>
                    <a
                      href={waLink(booking.phone, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ size: "sm" }), "h-9")}
                    >
                      Kirim ke WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
