"use client"

import Link from "next/link"
import { AlertTriangle, Plus } from "lucide-react"

import { EmptyState, StudioLoading, StatusBadge } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { attireById, packageById, studio } from "@/lib/catalog"
import {
  daysUntil,
  EVENT_LABEL,
  formatShortDate,
  formatTime,
  greeting,
  rupiah,
} from "@/lib/format"
import {
  collectionReminders,
  conflictLabel,
  conflictPairs,
  financeSummary,
  lateAttire,
  paymentStatus,
  sortBookings,
} from "@/lib/metrics"
import { cn } from "@/lib/utils"

export default function StudioHomePage() {
  const { ready, bookings, expenses, partnerships, combos } = useStudio()
  if (!ready) return <StudioLoading />

  const money = financeSummary(bookings, expenses)
  const today = bookings.filter((booking) => daysUntil(booking.date) === 0)
  const tomorrow = bookings.filter((booking) => daysUntil(booking.date) === 1)
  const monthCount = bookings.filter((booking) => {
    const days = daysUntil(booking.date)
    return days >= -31 && days <= 31
  }).length
  const counts = {
    all: bookings.length,
    dp: bookings.filter((booking) => paymentStatus(booking) === "belum_dp").length,
    partial: bookings.filter((booking) => paymentStatus(booking) === "belum_lunas").length,
    paid: bookings.filter((booking) => paymentStatus(booking) === "lunas").length,
  }
  const pairs = conflictPairs(bookings)
  const reminders = collectionReminders(bookings)
  const late = lateAttire(bookings)
  const upcoming = sortBookings(bookings.filter((booking) => daysUntil(booking.date) >= 0)).slice(0, 4)

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="text-4xl">{studio.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {studio.owner} · {studio.city}. Angka di bawah dihitung dari jadwal yang tersimpan di browser ini.
          </p>
        </div>
        <Link
          href="/studio/jadwal/baru"
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
        >
          <Plus />
          Buat booking
        </Link>
      </div>

      <Link
        href="/studio/partner"
        className="grid gap-1 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <span>
          <span className="block font-display text-2xl">Partner dan kombo</span>
          <span className="text-sm text-muted-foreground">
            {partnerships.filter((item) => item.status === "diterima").length} kerja sama ·{" "}
            {partnerships.filter((item) => item.status === "diminta").length} menunggu ·{" "}
            {combos.filter((combo) => combo.published).length} kombo di pricelist
          </span>
        </span>
        <span className="text-sm font-medium text-primary">Cari dekor, makeup, hairdo, atau sewa baju</span>
      </Link>

      <section className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="text-sm opacity-80">Laba bersih tahun ini</p>
          <p className="font-display text-4xl sm:text-5xl">{rupiah(money.profit)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p>Pemasukan {rupiah(money.income)}</p>
            <p>Pengeluaran {rupiah(money.spent)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            [counts.all, "Booking", "/studio/jadwal"],
            [counts.dp, "Belum DP", "/studio/jadwal?status=belum_dp"],
            [counts.partial, "Belum lunas", "/studio/jadwal?status=belum_lunas"],
            [counts.paid, "Lunas", "/studio/jadwal?status=lunas"],
          ].map(([value, label, href]) => (
            <Link
              key={String(label)}
              href={String(href)}
              className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10"
            >
              <p className="font-display text-3xl">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [today.length, "Hari ini"],
          [tomorrow.length, "Besok"],
          [monthCount, "Sekitar bulan ini"],
        ].map(([value, label]) => (
          <div key={String(label)} className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-3xl">{value}</p>
          </div>
        ))}
      </section>

      {pairs.length || late.length || reminders.length ? (
        <section className="grid gap-2">
          <h2 className="text-2xl">Yang perlu dilihat</h2>
          {pairs.map((pair) => (
            <Link
              key={`${pair.a.id}-${pair.b.id}`}
              href="/studio/jadwal?status=bentrok"
              className="flex items-start gap-3 rounded-xl bg-accent px-4 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {pair.a.clientName} dan {pair.b.clientName} bentrok. {conflictLabel(pair)}.
              </span>
            </Link>
          ))}
          {late.map((booking) => (
            <Link
              key={booking.id}
              href="/studio/gaun"
              className="flex items-start gap-3 rounded-xl bg-accent px-4 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {attireById(booking.attireId)?.name} untuk {booking.clientName} belum ditandai kembali.
              </span>
            </Link>
          ))}
          {reminders.map((booking) => (
            <Link
              key={`tagih-${booking.id}`}
              href={`/studio/invoice/${booking.id}`}
              className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
            >
              {booking.clientName} acara {daysUntil(booking.date) === 0 ? "hari ini" : `H-${daysUntil(booking.date)}`}, sisa {rupiah(booking.price - booking.paid)}.
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState
          title="Tidak ada yang menunggumu"
          body="Tidak ada bentrok, gaun telat, atau tagihan H-7. Jadwal yang akan datang tetap ada di bawah."
        />
      )}

      <section className="grid gap-3">
        <h2 className="text-2xl">Jadwal terdekat</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Belum ada jadwal ke depan"
            body="Buat booking baru, atau tempel chat klien di halaman jadwal."
          />
        ) : (
          upcoming.map((booking) => (
            <Link
              key={booking.id}
              href={`/studio/invoice/${booking.id}`}
              className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{booking.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatShortDate(booking.date)} · {formatTime(booking.time)} · {EVENT_LABEL[booking.eventType]} · {packageById(booking.packageId)?.name}
                </p>
              </div>
              <StatusBadge status={paymentStatus(booking)} />
            </Link>
          ))
        )}
      </section>
    </div>
  )
}
