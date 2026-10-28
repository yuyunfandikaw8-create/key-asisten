"use client"

import Link from "next/link"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { partnerById } from "@/lib/client-workspace"
import { cn } from "@/lib/utils"

export default function ClientMessagesPage() {
  const { ready, activeEvent } = useClientWorkspace()
  if (!ready) return <StudioLoading />

  const contacted =
    activeEvent?.slots
      .filter((slot) => slot.partnerId && slot.status !== "belum_booking")
      .map((slot) => partnerById(slot.partnerId!))
      .filter(Boolean) ?? []

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Pesan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Percakapan dengan vendor yang sudah dihubungi atau dimasukkan ke acara.
        </p>
      </div>

      {!contacted.length ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Belum ada percakapan. Masukkan vendor ke acara dulu, lalu hubungi mereka.
          </p>
          <Link href="/klien/cari" className={cn(buttonVariants(), "h-10 w-fit")}>
            Cari vendor
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacted.map((partner) =>
            partner ? (
              <a
                key={partner.id}
                href={`https://wa.me/62${partner.phone.replace(/^0/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition hover:bg-muted/30"
              >
                <p className="font-medium">{partner.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lanjutkan chat via WhatsApp · {partner.phone}
                </p>
              </a>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
