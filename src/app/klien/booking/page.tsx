"use client"

import Link from "next/link"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  categoryById,
  CLIENT_BOOKING_STATUS_LABEL,
  partnerById,
} from "@/lib/client-workspace"
import { cn } from "@/lib/utils"

export default function ClientBookingsPage() {
  const { ready, workspace } = useClientWorkspace()
  if (!ready) return <StudioLoading />

  const rows = workspace.events.flatMap((event) =>
    event.slots
      .filter((slot) => slot.partnerId && slot.status !== "belum_booking")
      .map((slot) => ({
        event,
        slot,
        partner: partnerById(slot.partnerId!),
        category: categoryById(slot.needId),
      }))
  )

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Booking Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status booking per vendor: menunggu konfirmasi, DP, lunas, hingga selesai.
        </p>
      </div>

      {!rows.length ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Belum ada booking. Isi vendor di Acara Saya untuk mulai melacak status.
          </p>
          <Link href="/klien/acara" className={cn(buttonVariants(), "h-10 w-fit")}>
            Buka Acara Saya
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ event, slot, partner, category }) => (
            <article
              key={`${event.id}-${slot.needId}`}
              className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <p className="text-xs text-muted-foreground">{event.title}</p>
              <p className="mt-1 font-medium">
                {category?.emoji} {category?.label} · {partner?.name}
              </p>
              <p className="mt-1 text-sm text-primary">
                {CLIENT_BOOKING_STATUS_LABEL[slot.status]}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
