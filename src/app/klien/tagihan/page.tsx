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
import { rupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function ClientInvoicesPage() {
  const { ready, workspace } = useClientWorkspace()
  if (!ready) return <StudioLoading />

  const invoices = workspace.events.flatMap((event) =>
    event.slots
      .filter(
        (slot) =>
          slot.partnerId &&
          (slot.status === "menunggu_dp" ||
            slot.status === "sudah_dp" ||
            slot.status === "lunas" ||
            slot.status === "selesai")
      )
      .map((slot) => {
        const partner = partnerById(slot.partnerId!)
        return {
          event,
          slot,
          partner,
          category: categoryById(slot.needId),
          amount: partner?.share ?? 0,
        }
      })
  )

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Tagihan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoice dari masing-masing vendor di acara kamu.
        </p>
      </div>

      {!invoices.length ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Belum ada tagihan. Setelah vendor masuk tahap DP atau lunas, tagihan muncul di
            sini.
          </p>
          <Link href="/klien/booking" className={cn(buttonVariants(), "h-10 w-fit")}>
            Lihat booking
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {invoices.map(({ event, slot, partner, category, amount }) => (
            <article
              key={`${event.id}-${slot.needId}`}
              className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <p className="text-xs text-muted-foreground">{event.title}</p>
              <p className="mt-1 font-medium">
                {category?.emoji} {partner?.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {CLIENT_BOOKING_STATUS_LABEL[slot.status]}
                </span>
                <span className="font-medium">{rupiah(amount)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
