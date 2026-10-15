"use client"

import Link from "next/link"
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Handshake,
  Plus,
  Receipt,
  Shirt,
  Sparkles,
} from "lucide-react"

import { EmptyState, StudioLoading, StatusBadge } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { attireById, attires, packageById, studio } from "@/lib/catalog"
import {
  daysUntil,
  EVENT_LABEL,
  formatShortDate,
  formatTime,
  greeting,
  rupiah,
  todayISO,
} from "@/lib/format"
import {
  attireStatus,
  collectionReminders,
  conflictLabel,
  conflictPairs,
  financeSummary,
  isSameMonth,
  lateAttire,
  monthlyIncomeSeries,
  paymentStatus,
  sortBookings,
} from "@/lib/metrics"
import { cn } from "@/lib/utils"

function ProfitSparkline({ values }: { values: number[] }) {
  const width = 220
  const height = 72
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / max) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full max-w-[220px]" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity={0.95}
      />
      {values.map((value, index) => {
        const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
        const y = height - (value / max) * (height - 8) - 4
        return <circle key={`${index}-${value}`} cx={x} cy={y} r="3" fill="currentColor" />
      })}
    </svg>
  )
}

export default function StudioHomePage() {
  const { ready, bookings, expenses, partnerships, combos } = useStudio()
  if (!ready) return <StudioLoading />

  const money = financeSummary(bookings, expenses)
  const series = monthlyIncomeSeries(bookings, 6, todayISO())
  const today = bookings.filter((booking) => daysUntil(booking.date) === 0)
  const tomorrow = bookings.filter((booking) => daysUntil(booking.date) === 1)
  const monthCount = bookings.filter((booking) => isSameMonth(booking.date)).length
  const counts = {
    all: bookings.length,
    dp: bookings.filter((booking) => paymentStatus(booking) === "belum_dp").length,
    partial: bookings.filter((booking) => paymentStatus(booking) === "belum_lunas").length,
    paid: bookings.filter((booking) => paymentStatus(booking) === "lunas").length,
  }
  const pairs = conflictPairs(bookings)
  const reminders = collectionReminders(bookings)
  const late = lateAttire(bookings)
  const upcoming = sortBookings(bookings.filter((booking) => daysUntil(booking.date) >= 0)).slice(
    0,
    4
  )
  const heldAttire = attires.filter((attire) => attireStatus(attire.id, bookings).tone !== "free")
    .length
  const acceptedPartners = partnerships.filter((item) => item.status === "diterima").length
  const waitingPartners = partnerships.filter((item) => item.status === "diminta").length
  const publishedCombos = combos.filter((combo) => combo.published).length

  const dayKpis = [
    {
      value: today.length,
      label: "Hari ini",
      hint: today.length ? "Acara yang harus siap" : "Kosong, aman",
      href: "/studio/jadwal?status=hari_ini",
      className: "bg-[oklch(0.93_0.04_220)] text-[oklch(0.35_0.06_220)]",
      iconClass: "bg-[oklch(0.86_0.06_220)] text-[oklch(0.42_0.1_220)]",
      Icon: CalendarDays,
    },
    {
      value: tomorrow.length,
      label: "Besok",
      hint: tomorrow.length ? "Siapkan DP dan gaun" : "Belum ada booking",
      href: "/studio/jadwal?status=besok",
      className: "bg-[oklch(0.94_0.03_15)] text-[oklch(0.38_0.08_15)]",
      iconClass: "bg-[oklch(0.88_0.05_15)] text-[oklch(0.48_0.12_15)]",
      Icon: Sparkles,
    },
    {
      value: monthCount,
      label: "Bulan ini",
      hint: `${counts.dp} belum DP`,
      href: "/studio/jadwal",
      className: "bg-[oklch(0.94_0.04_75)] text-[oklch(0.38_0.06_55)]",
      iconClass: "bg-[oklch(0.88_0.06_75)] text-[oklch(0.48_0.1_55)]",
      Icon: CalendarDays,
    },
  ]

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="text-4xl">{studio.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {studio.owner} · {studio.city}. Angka di bawah dihitung dari jadwal di browser ini.
          </p>
          {counts.partial > 0 ? (
            <p className="mt-2 text-sm text-primary">
              {counts.partial} tagihan belum lunas · {reminders.length} perlu ditagih H-7
            </p>
          ) : null}
        </div>
        <Link href="/studio/jadwal/baru" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          <Plus />
          Buat booking
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/studio/jadwal/baru"
          className="flex items-center gap-4 rounded-2xl bg-[oklch(0.62_0.12_145)] px-5 py-5 text-white shadow-sm transition hover:brightness-105"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white/20">
            <Plus className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold">Buat booking</span>
            <span className="text-sm text-white/85">Tempel chat atau isi manual</span>
          </span>
        </Link>
        <Link
          href={`/p/${studio.slug}`}
          className="flex items-center gap-4 rounded-2xl bg-[oklch(0.42_0.08_280)] px-5 py-5 text-white shadow-sm transition hover:brightness-105"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white/20">
            <Receipt className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold">Pricelist klien</span>
            <span className="text-sm text-white/85">Cek pengajuan & kombo yang masuk</span>
          </span>
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide uppercase opacity-80">
              KPI studio · Laba bersih tahun ini
            </p>
            <p className="mt-2 font-display text-4xl sm:text-5xl">{rupiah(money.profit)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
              <div>
                <p className="opacity-75">Pemasukan</p>
                <p className="font-medium">{rupiah(money.income)}</p>
              </div>
              <div>
                <p className="opacity-75">Pengeluaran</p>
                <p className="font-medium">{rupiah(money.spent)}</p>
              </div>
            </div>
          </div>
          <div className="opacity-95">
            <p className="mb-1 text-right text-xs opacity-75">Pemasukan 6 bulan</p>
            <ProfitSparkline values={series.map((item) => item.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/15 bg-black/5 text-sm sm:grid-cols-4">
          {[
            [counts.all, "Booking", "/studio/jadwal"],
            [counts.dp, "Belum DP", "/studio/jadwal?status=belum_dp"],
            [counts.partial, "Belum lunas", "/studio/jadwal?status=belum_lunas"],
            [counts.paid, "Lunas", "/studio/jadwal?status=lunas"],
          ].map(([value, label, href]) => (
            <Link
              key={String(label)}
              href={String(href)}
              className="px-4 py-3 transition hover:bg-white/10"
            >
              <span className="font-display text-2xl">{value}</span>
              <span className="mt-0.5 block text-xs opacity-80">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Ringkasan</p>
            <h2 className="text-2xl">Hari ini, besok, bulan ini</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {dayKpis.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn("rounded-2xl px-4 py-4 transition hover:brightness-[0.98]", item.className)}
            >
              <span className={cn("inline-flex size-9 items-center justify-center rounded-xl", item.iconClass)}>
                <item.Icon className="size-4" />
              </span>
              <p className="mt-4 font-display text-4xl leading-none">{item.value}</p>
              <p className="mt-2 text-sm font-semibold tracking-wide uppercase">{item.label}</p>
              <p className="mt-1 text-sm opacity-80">{item.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl">Akses cepat</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              href: "/studio/partner",
              title: "Partner & kombo",
              body: `${acceptedPartners} kerja sama · ${waitingPartners} menunggu · ${publishedCombos} kombo`,
              Icon: Handshake,
            },
            {
              href: `/p/${studio.slug}`,
              title: "Pricelist publik",
              body: "Taruh di bio Instagram. Klien ajukan tanggal sendiri.",
              Icon: Receipt,
            },
            {
              href: "/studio/gaun",
              title: "Gaun & wardrobe",
              body: `${heldAttire} sedang dipegang · ${attires.length} item`,
              Icon: Shirt,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10 transition hover:bg-accent/40"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <item.Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.title}</span>
                <span className="text-sm text-muted-foreground">{item.body}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
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
                {attireById(booking.attireId)?.name} untuk {booking.clientName} belum ditandai
                kembali.
              </span>
            </Link>
          ))}
          {reminders.map((booking) => (
            <Link
              key={`tagih-${booking.id}`}
              href={`/studio/invoice/${booking.id}`}
              className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
            >
              {booking.clientName} acara{" "}
              {daysUntil(booking.date) === 0 ? "hari ini" : `H-${daysUntil(booking.date)}`}, sisa{" "}
              {rupiah(booking.price - booking.paid)}.
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
                  {formatShortDate(booking.date)} · {formatTime(booking.time)} ·{" "}
                  {EVENT_LABEL[booking.eventType]} · {packageById(booking.packageId)?.name}
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
