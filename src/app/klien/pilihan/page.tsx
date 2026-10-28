"use client"

import Link from "next/link"
import { Heart, Star } from "lucide-react"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { partnerById, tradeLabelForPartner } from "@/lib/client-workspace"
import { rupiah } from "@/lib/format"
import {
  partnerAvailable,
  partnerPortfolioCount,
  partnerRating,
  type Partner,
} from "@/lib/partners"
import { cn } from "@/lib/utils"

function CompareTable({ items }: { items: Partner[] }) {
  if (items.length < 2) return null
  const columns = items.slice(0, 4)
  const rows: { label: string; value: (partner: Partner) => string }[] = [
    {
      label: "Portofolio",
      value: (partner) => `${partnerPortfolioCount(partner)} foto`,
    },
    {
      label: "Rating",
      value: (partner) => `⭐ ${partnerRating(partner).toFixed(1)}`,
    },
    {
      label: "Harga mulai",
      value: (partner) => rupiah(partner.share).replace("Rp", "Rp").replace(",00", ""),
    },
    {
      label: "Lokasi",
      value: (partner) => partner.city,
    },
    {
      label: "Status",
      value: (partner) => (partnerAvailable(partner) ? "Tersedia" : "Padat"),
    },
  ]

  return (
    <section className="grid gap-3 overflow-x-auto rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div>
        <h2 className="text-lg font-medium">Bandingkan</h2>
        <p className="text-sm text-muted-foreground">
          Bandingkan vendor di Pilihan Saya sebelum memutuskan.
        </p>
      </div>
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="py-2 pr-3 text-left font-medium text-muted-foreground"> </th>
            {columns.map((partner) => (
              <th key={partner.id} className="px-2 py-2 text-left font-medium">
                <Link href={`/klien/vendor/${partner.id}`} className="hover:text-primary">
                  {partner.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-foreground/10">
              <td className="py-2.5 pr-3 text-muted-foreground">{row.label}</td>
              {columns.map((partner) => (
                <td key={`${row.label}-${partner.id}`} className="px-2 py-2.5 font-medium">
                  {row.value(partner)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default function ClientShortlistPage() {
  const { ready, workspace, toggleShortlist, activeEvent, assignVendor } =
    useClientWorkspace()

  if (!ready) return <StudioLoading />

  const items = workspace.shortlist
    .map((id) => partnerById(id))
    .filter((partner): partner is Partner => Boolean(partner))

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Pilihan Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simpan beberapa vendor, bandingkan portofolio & harga, lalu booking.
        </p>
      </div>

      {!items.length ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Belum ada vendor tersimpan. Cari vendor lalu ketuk Simpan / ❤️ Pilihan Saya.
          </p>
          <Link href="/klien/cari" className={cn(buttonVariants(), "h-10 w-fit")}>
            Cari vendor
          </Link>
        </div>
      ) : (
        <>
          <CompareTable items={items} />

          <div className="grid gap-3">
            {items.map((partner) => {
              const rating = partnerRating(partner)
              const photos = partnerPortfolioCount(partner)
              const available = partnerAvailable(partner)
              return (
                <article
                  key={partner.id}
                  className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        <Link
                          href={`/klien/vendor/${partner.id}`}
                          className="hover:text-primary"
                        >
                          {partner.name}
                        </Link>{" "}
                        <Heart className="ml-1 inline size-3.5 fill-primary text-primary" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tradeLabelForPartner(partner)} · {partner.area}, {partner.city}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-current text-primary" />
                          {rating.toFixed(1)}
                        </span>
                        <span>mulai {rupiah(partner.share)}</span>
                        <span>{photos} foto</span>
                        <span>{available ? "Tersedia" : "Padat"}</span>
                      </p>
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
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/klien/vendor/${partner.id}`}
                      className={cn(buttonVariants({ variant: "outline" }), "h-10")}
                    >
                      Lihat profil
                    </Link>
                    {activeEvent ? (
                      <button
                        type="button"
                        className={cn(buttonVariants({ variant: "outline" }), "h-10")}
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
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
