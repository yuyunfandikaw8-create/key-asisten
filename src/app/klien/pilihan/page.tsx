"use client"

import Link from "next/link"
import { Heart } from "lucide-react"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { partnerById, tradeLabelForPartner } from "@/lib/client-workspace"
import { rupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function ClientShortlistPage() {
  const { ready, workspace, toggleShortlist, activeEvent, assignVendor } =
    useClientWorkspace()

  if (!ready) return <StudioLoading />

  const items = workspace.shortlist
    .map((id) => partnerById(id))
    .filter(Boolean)

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Pilihan Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simpan beberapa vendor untuk dibandingkan sebelum booking.
        </p>
      </div>

      {!items.length ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Belum ada vendor tersimpan. Cari vendor lalu ketuk Simpan.
          </p>
          <Link href="/klien/cari" className={cn(buttonVariants(), "h-10 w-fit")}>
            Cari vendor
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((partner) =>
            partner ? (
              <article
                key={partner.id}
                className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {partner.name} <Heart className="ml-1 inline size-3.5 fill-primary text-primary" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tradeLabelForPartner(partner)} · {partner.area}, {partner.city}
                    </p>
                    <p className="mt-1 text-sm">mulai {rupiah(partner.share)}</p>
                  </div>
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                    onClick={() => toggleShortlist(partner.id)}
                  >
                    Hapus
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{partner.blurb}</p>
                {activeEvent ? (
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline" }), "h-10 w-fit")}
                    onClick={() => {
                      const need =
                        partner.trade === "makeup"
                          ? "makeup"
                          : partner.trade === "hair"
                            ? "hair"
                            : partner.trade === "dekor"
                              ? "dekor"
                              : partner.trade === "baju"
                                ? "baju"
                                : partner.trade === "content"
                                  ? "content"
                                  : "photo"
                      assignVendor(
                        activeEvent.id,
                        need,
                        partner.id,
                        "menunggu_konfirmasi"
                      )
                    }}
                  >
                    Masukkan ke acara aktif
                  </button>
                ) : null}
              </article>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
