"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { bookingEventLabel, bookingPackageName } from "@/lib/catalog"
import { daysUntil, formatShortDate, formatTime } from "@/lib/format"
import { conflictPairs, paymentStatus, sortBookings } from "@/lib/metrics"
import type { PaymentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const filters: { id: string; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "hari_ini", label: "Hari ini" },
  { id: "besok", label: "Besok" },
  { id: "belum_dp", label: "Belum DP" },
  { id: "belum_lunas", label: "Belum lunas" },
  { id: "lunas", label: "Lunas" },
  { id: "bentrok", label: "Bentrok" },
]

export function JadwalBoard() {
  const params = useSearchParams()
  const status = params.get("status") ?? "semua"
  const { ready, bookings } = useStudio()
  const [query, setQuery] = useState("")

  const conflictIds = useMemo(() => {
    const ids = new Set<string>()
    for (const pair of conflictPairs(bookings)) {
      ids.add(pair.a.id)
      ids.add(pair.b.id)
    }
    return ids
  }, [bookings])

  if (!ready) return <StudioLoading />

  const filtered = sortBookings(bookings).filter((booking) => {
    const haystack = `${booking.clientName} ${booking.location}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (status === "hari_ini") return daysUntil(booking.date) === 0
    if (status === "besok") return daysUntil(booking.date) === 1
    if (status === "bentrok") return conflictIds.has(booking.id)
    if (status === "belum_dp" || status === "belum_lunas" || status === "lunas") {
      return paymentStatus(booking) === (status as PaymentStatus)
    }
    return true
  })

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl">Jadwal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cari klien, saring status bayar, atau lihat yang bentrok.
          </p>
        </div>
        <Link
          href="/studio/jadwal/baru"
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
        >
          <Plus />
          Booking baru
        </Link>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari nama atau lokasi"
        className="h-10 bg-card"
        aria-label="Cari jadwal"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Link
            key={filter.id}
            href={filter.id === "semua" ? "/studio/jadwal" : `/studio/jadwal?status=${filter.id}`}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm",
              status === filter.id
                ? "bg-primary text-primary-foreground"
                : "bg-card ring-1 ring-foreground/10"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada jadwal di saringan ini"
          body={
            query
              ? `Tidak ada klien atau lokasi yang memuat “${query}”.`
              : "Ubah saringan, atau buat booking dari chat WhatsApp."
          }
        />
      ) : (
        <div className="grid gap-2">
          {filtered.map((booking) => (
            <Link
              key={booking.id}
              href={`/studio/invoice/${booking.id}`}
              className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{booking.clientName}</p>
                <StatusBadge status={paymentStatus(booking)} />
                {conflictIds.has(booking.id) ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs">Bentrok</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatShortDate(booking.date)} · {formatTime(booking.time)} ·{" "}
                {bookingEventLabel(booking)} · {bookingPackageName(booking)}
              </p>
              <p className="text-sm text-muted-foreground">{booking.location}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
