"use client"

import Link from "next/link"

import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { formatShortDate, invoiceNo, rupiah } from "@/lib/format"
import { balance, paymentStatus, sortBookings } from "@/lib/metrics"

export default function InvoiceListPage() {
  const { ready, bookings } = useStudio()
  if (!ready) return <StudioLoading />

  const rows = sortBookings(bookings)

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Setiap jadwal punya tagihan. Buka salah satu untuk mencatat DP atau membuka WhatsApp.
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada tagihan"
          body="Buat booking dulu. Invoicenya ikut terbentuk dari harga paket."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {rows.map((booking) => (
            <Link
              key={booking.id}
              href={`/studio/invoice/${booking.id}`}
              className="flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{booking.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {invoiceNo(booking.date, booking.id)} · {formatShortDate(booking.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm">Sisa {rupiah(balance(booking))}</p>
                <StatusBadge status={paymentStatus(booking)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
