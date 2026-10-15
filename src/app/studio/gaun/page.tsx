"use client"

import { EmptyState, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import { attires } from "@/lib/catalog"
import { formatShortDate } from "@/lib/format"
import { attireStatus, conflictPairs } from "@/lib/metrics"
import { cn } from "@/lib/utils"

export default function AttirePage() {
  const { ready, bookings, updateBooking } = useStudio()
  if (!ready) return <StudioLoading />

  const doubled = new Set(
    conflictPairs(bookings)
      .filter((pair) => pair.sameAttire)
      .map((pair) => pair.a.attireId)
  )

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Gaun</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Status mengikuti jadwal. Gaun yang tanggalnya sudah lewat tetap ditahan sampai kamu menandai kembali.
        </p>
      </div>
      {attires.length === 0 ? (
        <EmptyState title="Koleksi masih kosong" body="Tambahkan gaun lewat data studio." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {attires.map((attire) => {
            const status = attireStatus(attire.id, bookings)
            return (
              <article key={attire.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex items-start gap-3">
                  <span
                    className="size-12 shrink-0 rounded-xl ring-1 ring-foreground/10"
                    style={{ background: attire.tone }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-2xl">{attire.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {attire.category} · ukuran {attire.size}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-4 inline-flex rounded-full px-2 py-1 text-xs",
                    status.tone === "free" ? "bg-muted" : "bg-accent"
                  )}
                >
                  {status.label}
                  {doubled.has(attire.id) ? " · bentrok" : ""}
                </p>
                {status.booking ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {status.booking.clientName} · {formatShortDate(status.booking.date)}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Belum ada pemakai di jadwal yang tersimpan.</p>
                )}
                {status.tone === "late" && status.booking ? (
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => updateBooking(status.booking!.id, { attireReturned: true })}
                  >
                    Tandai kembali
                  </Button>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
