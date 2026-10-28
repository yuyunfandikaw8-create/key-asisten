"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { EmptyState, StatusBadge, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { bookingEventLabel, bookingPackageName } from "@/lib/catalog"
import { APPROVAL_LABEL, daysUntil, formatShortDate, formatTime } from "@/lib/format"
import { conflictPairs, paymentStatus, sortBookings } from "@/lib/metrics"
import type { BookingApprovalStatus, PaymentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const filters: { id: string; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "pengajuan", label: "Pengajuan" },
  { id: "hari_ini", label: "Hari ini" },
  { id: "besok", label: "Besok" },
  { id: "belum_dp", label: "Belum Bayar DP" },
  { id: "belum_lunas", label: "Belum Lunas" },
  { id: "lunas", label: "Lunas" },
  { id: "bentrok", label: "Bentrok" },
]

function approvalOf(booking: { approvalStatus?: BookingApprovalStatus }): BookingApprovalStatus {
  return booking.approvalStatus ?? "diterima"
}

export function JadwalBoard() {
  const params = useSearchParams()
  const status = params.get("status") ?? "semua"
  const { ready, bookings, updateBooking } = useStudio()
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
    if (status === "pengajuan") {
      const approval = approvalOf(booking)
      return approval === "diajukan" || approval === "menunggu_konfirmasi"
    }
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
            Kelola jadwal dan booking dengan mudah. Pengajuan dari link booking menunggu keputusanmu.
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
          title="Belum ada jadwal"
          body={
            query
              ? `Tidak ada klien atau lokasi yang memuat “${query}”.`
              : status === "pengajuan"
                ? "Belum ada pengajuan dari link booking yang menunggu keputusan."
                : "Belum ada booking yang sesuai dengan pilihanmu."
          }
        />
      ) : (
        <div className="grid gap-2">
          {filtered.map((booking) => {
            const approval = approvalOf(booking)
            const needsDecision =
              approval === "diajukan" || approval === "menunggu_konfirmasi"
            return (
              <div
                key={booking.id}
                className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/studio/invoice/${booking.id}`}
                    className="font-medium hover:underline"
                  >
                    {booking.clientName}
                  </Link>
                  <StatusBadge status={paymentStatus(booking)} />
                  {approval !== "diterima" ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        approval === "ditolak"
                          ? "bg-muted text-muted-foreground"
                          : "bg-accent text-accent-foreground"
                      )}
                    >
                      {APPROVAL_LABEL[approval]}
                    </span>
                  ) : null}
                  {conflictIds.has(booking.id) ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs">Bentrok</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatShortDate(booking.date)} · {formatTime(booking.time)} ·{" "}
                  {bookingEventLabel(booking)} · {bookingPackageName(booking)}
                </p>
                <p className="text-sm text-muted-foreground">{booking.location}</p>
                {needsDecision ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        updateBooking(booking.id, { approvalStatus: "diterima" })
                      }
                    >
                      Terima
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateBooking(booking.id, {
                          approvalStatus: "menunggu_konfirmasi",
                        })
                      }
                    >
                      Perlu dikonfirmasi
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateBooking(booking.id, { approvalStatus: "ditolak" })
                      }
                    >
                      Tolak
                    </Button>
                    <Link
                      href={`/studio/invoice/${booking.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      Lihat detail
                    </Link>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
