"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Handshake,
  Inbox,
  Plus,
  Receipt,
  Users,
  Wallet,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { clearOnboardingDone } from "@/lib/onboarding"
import { EmptyState, StudioLoading, StatusBadge } from "@/components/studio-bits"
import { StudioMonthCalendar } from "@/components/studio-month-calendar"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  bookingAttireName,
  bookingEventLabel,
  bookingPackageName,
  studio,
} from "@/lib/catalog"
import { studioBrand } from "@/lib/studio-brand"
import {
  daysUntil,
  formatDate,
  formatShortDate,
  formatTime,
  greeting,
  rupiah,
  todayISO,
} from "@/lib/format"
import {
  collectionReminders,
  conflictLabel,
  conflictPairs,
  financeSummary,
  incomePeriodTitle,
  incomeSeries,
  lateAttire,
  paymentStatus,
  sortBookings,
  type IncomePeriod,
} from "@/lib/metrics"
import { partners } from "@/lib/partners"
import type { Booking } from "@/lib/types"
import { cn } from "@/lib/utils"

function ProfitSparkline({
  values,
  labels,
}: {
  values: number[]
  labels?: string[]
}) {
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

  const showEdgeLabels = Boolean(labels && labels.length >= 2)

  return (
    <div className="w-full max-w-[220px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" aria-hidden>
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
      {showEdgeLabels ? (
        <div className="mt-1 flex justify-between text-[10px] opacity-70">
          <span>{labels![0]}</span>
          <span>{labels![labels!.length - 1]}</span>
        </div>
      ) : null}
    </div>
  )
}

const INCOME_PERIODS: { id: IncomePeriod; label: string }[] = [
  { id: "minggu", label: "1 minggu" },
  { id: "bulan", label: "1 bulan" },
  { id: "tahun", label: "1 tahun" },
]

type AgendaTone = "done" | "progress" | "wait"

function agendaStatus(booking: Booking, selectedDate: string): { label: string; tone: AgendaTone } {
  const today = todayISO()
  if (selectedDate < today) return { label: "Selesai", tone: "done" }
  if (selectedDate > today) return { label: "Menunggu", tone: "wait" }

  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const [hh = "0", mm = "0"] = booking.time.split(":")
  const start = Number(hh) * 60 + Number(mm)
  const end = start + 120

  if (minutesNow >= end) return { label: "Selesai", tone: "done" }
  if (minutesNow >= start) return { label: "Proses", tone: "progress" }
  return { label: "Menunggu", tone: "wait" }
}

function AgendaStatusPill({ tone, children }: { tone: AgendaTone; children: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
        tone === "done" && "bg-[oklch(0.92_0.05_155)] text-[oklch(0.4_0.1_155)]",
        tone === "progress" && "bg-[oklch(0.93_0.04_75)] text-[oklch(0.45_0.1_55)]",
        tone === "wait" && "bg-[oklch(0.93_0.03_250)] text-[oklch(0.42_0.1_250)]"
      )}
    >
      {children}
    </span>
  )
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)}rb`
  return rupiah(value)
}

export default function StudioHomePage() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const { ready, city, bookings, expenses, partnerships, combos, messages, viewMode } =
    useStudio()
  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const [selectedDate, setSelectedDate] = useState(() => todayISO())
  const [incomePeriod, setIncomePeriod] = useState<IncomePeriod>("bulan")
  const [reopening, setReopening] = useState(false)

  const markedDates = useMemo(
    () => [...new Set(bookings.map((booking) => booking.date))],
    [bookings]
  )

  const series = useMemo(
    () => incomeSeries(bookings, incomePeriod, todayISO()),
    [bookings, incomePeriod]
  )

  async function reopenBiodata() {
    setReopening(true)
    clearOnboardingDone(user?.email)
    const updated = await updateProfile({ onboardingStep: 2 })
    if (!updated) {
      setReopening(false)
      return
    }
    router.push("/onboarding")
  }

  if (!ready) return <StudioLoading />

  const money = financeSummary(bookings, expenses)
  const unreadInbox = messages.filter(
    (message) => message.city === city && message.sender === "partner" && !message.read
  ).length
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
  const acceptedPartners = partnerships.filter((item) => {
    const partner = partners.find((entry) => entry.id === item.partnerId)
    return item.status === "diterima" && partner?.city === city
  }).length
  const waitingPartners = partnerships.filter((item) => {
    const partner = partners.find((entry) => entry.id === item.partnerId)
    return item.status === "diminta" && partner?.city === city
  }).length
  const publishedCombos = combos.filter((combo) =>
    combo.published && combo.partnerIds.some((id) => partners.find((entry) => entry.id === id)?.city === city)
  ).length

  const dayBookings = sortBookings(bookings.filter((booking) => booking.date === selectedDate))
  const todayCount = bookings.filter((booking) => booking.date === todayISO()).length
  const waitingInvoices = counts.dp + counts.partial
  const uniqueClients = new Set(bookings.map((booking) => booking.clientName)).size
  const newClients = bookings.filter((booking) => daysUntil(booking.createdAt.slice(0, 10)) >= -7)
    .length

  const metricCards = [
    {
      label: "Jadwal",
      value: `${todayCount} Agenda`,
      href: "/studio/jadwal?status=hari_ini",
      Icon: CalendarDays,
    },
    {
      label: "Invoice",
      value: `${waitingInvoices} Menunggu`,
      href: "/studio/invoice",
      Icon: FileText,
    },
    {
      label: "Klien",
      value: `${newClients || uniqueClients} Baru`,
      href: "/studio/jadwal",
      Icon: Users,
    },
    {
      label: "Keuangan",
      value: compactMoney(money.profit),
      href: "/studio/keuangan",
      Icon: Wallet,
    },
  ]

  const selectedIsToday = selectedDate === todayISO()
  const dayTitle = selectedIsToday ? "Jadwal Hari Ini" : `Jadwal ${formatShortDate(selectedDate)}`

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Selamat datang. Semoga hari ini berjalan lancar
          </p>
          <h1 className="text-4xl">{brand.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {greeting()} · {formatDate(todayISO())}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{city}</p>
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

      <button
        type="button"
        onClick={() => void reopenBiodata()}
        disabled={reopening}
        className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition hover:bg-accent/40 disabled:opacity-60"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <ClipboardList className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">
            {reopening ? "Membuka biodata…" : "Kembali isi biodata awal"}
          </span>
          <span className="block text-sm text-muted-foreground">
            Perbarui data dari step 1–6: akun, bisnis, bidang, profil, dan layanan.
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide uppercase opacity-80">
              Laba bersih bulan ini
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
            <div className="mb-2 flex flex-col items-end gap-2">
              <p className="text-xs opacity-75">{incomePeriodTitle(incomePeriod)}</p>
              <div
                className="inline-flex rounded-full bg-black/15 p-0.5 text-[11px] font-medium"
                role="group"
                aria-label="Periode pemasukan"
              >
                {INCOME_PERIODS.map((period) => {
                  const active = incomePeriod === period.id
                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setIncomePeriod(period.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 transition",
                        active
                          ? "bg-white text-primary shadow-sm"
                          : "text-white/80 hover:text-white"
                      )}
                      aria-pressed={active}
                    >
                      {period.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <ProfitSparkline
              values={series.map((item) => item.value)}
              labels={series.map((item) => item.label)}
            />
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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricCards.map(({ label, value, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10 transition hover:bg-accent/40"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <p className="font-display text-2xl leading-none">{value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{dayTitle}</h2>
            <Link
              href="/studio/jadwal"
              className="text-sm font-medium text-primary hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          {dayBookings.length === 0 ? (
            <EmptyState
              title={selectedIsToday ? "Belum ada jadwal hari ini" : "Tidak ada jadwal di tanggal ini"}
              body="Pilih tanggal lain di kalender, atau buat booking baru."
            />
          ) : (
            <div className="space-y-2">
              {dayBookings.map((booking) => {
                const status = agendaStatus(booking, selectedDate)
                return (
                  <Link
                    key={booking.id}
                    href={`/studio/invoice/${booking.id}`}
                    className="flex items-center gap-3 rounded-xl bg-[oklch(0.975_0.01_20)] px-3 py-3 transition hover:bg-accent/50"
                  >
                    <span className="w-12 shrink-0 text-sm font-semibold text-primary sm:w-14">
                      {formatTime(booking.time)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {bookingPackageName(booking)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {booking.clientName} · {bookingEventLabel(booking)}
                      </p>
                    </div>
                    <AgendaStatusPill tone={status.tone}>{status.label}</AgendaStatusPill>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <StudioMonthCalendar
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </section>

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
            <span className="text-sm text-white/85">Tempel chat, screenshot, atau isi manual</span>
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

      <section className="grid gap-3">
        <h2 className="text-2xl">Akses cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/studio/inbox",
              title: "Inbox partner",
              body: unreadInbox
                ? `${unreadInbox} pesan baru di ${city}`
                : `Chat partner di ${city}`,
              Icon: Inbox,
            },
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
              href="/studio/jadwal"
              className="flex items-start gap-3 rounded-xl bg-accent px-4 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {bookingAttireName(booking)} untuk {booking.clientName} belum ditandai
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
          title="Semua aman untuk sekarang ✨"
          body="Tidak ada bentrok jadwal, gaun yang terlambat, atau tagihan H-7 yang perlu ditindaklanjuti. Jadwal mendatang tetap ada di bawah."
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
                  {bookingEventLabel(booking)} · {bookingPackageName(booking)}
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
