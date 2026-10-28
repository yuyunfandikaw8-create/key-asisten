"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Heart, Search, Star } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  categoryById,
  CLIENT_VENDOR_CATEGORIES,
  partnersForCategory,
  tradeLabelForPartner,
  type ClientNeedId,
} from "@/lib/client-workspace"
import { rupiah } from "@/lib/format"
import {
  partnerAvailable,
  partnerPortfolioCount,
  partnerRating,
} from "@/lib/partners"
import { cn } from "@/lib/utils"

export default function ClientSearchPage() {
  const { ready: authReady, user } = useAuth()
  const { ready, toggleShortlist, isShortlisted, activeEvent, assignVendor } =
    useClientWorkspace()
  const [needId, setNeedId] = useState<ClientNeedId | "all">("all")
  const [query, setQuery] = useState("")

  const listings = useMemo(() => {
    const city = user?.city || activeEvent?.city || undefined
    const pool =
      needId === "all"
        ? CLIENT_VENDOR_CATEGORIES.flatMap((category) =>
            partnersForCategory(category.id, city).map((partner) => ({
              partner,
              needId: category.id,
            }))
          )
        : partnersForCategory(needId, city).map((partner) => ({
            partner,
            needId,
          }))
    const seen = new Set<string>()
    const unique = pool.filter(({ partner, needId: nid }) => {
      const key = `${partner.id}:${nid}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const needle = query.trim().toLowerCase()
    if (!needle) return unique.slice(0, 24)
    return unique
      .filter(({ partner, needId: nid }) => {
        const category = categoryById(nid)
        const haystack =
          `${partner.name} ${tradeLabelForPartner(partner)} ${partner.area} ${partner.blurb} ${category?.label}`.toLowerCase()
        return haystack.includes(needle)
      })
      .slice(0, 24)
  }, [activeEvent?.city, needId, query, user?.city])

  if (!authReady || !ready || !user) return <StudioLoading />

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Cari Vendor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lihat portofolio dulu, simpan ke Pilihan Saya, lalu bandingkan sebelum booking.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setNeedId("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm ring-1 transition",
            needId === "all"
              ? "bg-primary text-primary-foreground ring-primary"
              : "bg-background ring-foreground/10 hover:bg-muted/50"
          )}
        >
          Semua
        </button>
        {CLIENT_VENDOR_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setNeedId(category.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm ring-1 transition",
              needId === category.id
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-background ring-foreground/10 hover:bg-muted/50"
            )}
          >
            {category.emoji} {category.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama, area, atau jenis jasa…"
          className="h-11 bg-card pl-10"
        />
      </div>

      {!listings.length ? (
        <p className="rounded-2xl bg-card px-4 py-8 text-sm text-muted-foreground ring-1 ring-foreground/10">
          Belum ada vendor yang cocok. Coba kategori atau kata kunci lain.
        </p>
      ) : (
        <div className="grid gap-3">
          {listings.map(({ partner, needId: nid }) => {
            const liked = isShortlisted(partner.id)
            const category = categoryById(nid)
            const rating = partnerRating(partner)
            const photos = partnerPortfolioCount(partner)
            const available = partnerAvailable(partner)
            return (
              <article
                key={`${partner.id}-${nid}`}
                className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {category?.emoji} {category?.label}
                    </p>
                    <Link
                      href={`/klien/vendor/${partner.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {partner.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Star className="size-3.5 fill-current text-primary" />
                        {rating.toFixed(1)}
                      </span>
                      <span>
                        {partner.area}, {partner.city}
                      </span>
                    </p>
                    <p className="mt-1 text-sm">
                      mulai {rupiah(partner.share)} · {photos} foto ·{" "}
                      {available ? "Tersedia" : "Padat"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleShortlist(partner.id)}
                    className={cn(
                      buttonVariants({ variant: liked ? "default" : "outline", size: "sm" }),
                      "h-9"
                    )}
                    aria-label={liked ? "Hapus dari pilihan" : "Simpan ke pilihan"}
                  >
                    <Heart className={cn("size-4", liked && "fill-current")} />
                    {liked ? "Tersimpan" : "Simpan"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{partner.blurb}</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/klien/vendor/${partner.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "h-10")}
                  >
                    Lihat profil & portofolio
                  </Link>
                  {activeEvent ? (
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: "outline" }), "h-10")}
                      onClick={() =>
                        assignVendor(activeEvent.id, nid, partner.id, "menunggu_konfirmasi")
                      }
                    >
                      Masukkan ke {activeEvent.title}
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
