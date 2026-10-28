"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Heart, Star } from "lucide-react"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { partnerById, tradeLabelForPartner } from "@/lib/client-workspace"
import { rupiah } from "@/lib/format"
import { portfolioPhotoCount } from "@/lib/portfolio"
import {
  listDiscoverablePublicProfiles,
  parsePublicVendorShortlistId,
  startingPrice,
  type PublicBookingProfile,
} from "@/lib/public-booking-profile"
import {
  partnerAvailable,
  partnerPortfolioCount,
  partnerRating,
  type Partner,
} from "@/lib/partners"
import { cn } from "@/lib/utils"

type ShortItem =
  | { kind: "partner"; id: string; partner: Partner }
  | { kind: "public"; id: string; profile: PublicBookingProfile }

function CompareTable({
  partners,
  publics,
}: {
  partners: Partner[]
  publics: PublicBookingProfile[]
}) {
  const total = partners.length + publics.length
  if (total < 2) return null

  const partnerCols = partners.slice(0, 4)
  const publicCols = publics.slice(0, Math.max(0, 4 - partnerCols.length))

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
            {partnerCols.map((partner) => (
              <th key={partner.id} className="px-2 py-2 text-left font-medium">
                <Link href={`/klien/vendor/${partner.id}`} className="hover:text-primary">
                  {partner.name}
                </Link>
              </th>
            ))}
            {publicCols.map((profile) => (
              <th key={profile.slug} className="px-2 py-2 text-left font-medium">
                <Link href={`/p/${profile.slug}`} className="hover:text-primary">
                  {profile.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-foreground/10">
            <td className="py-2.5 pr-3 text-muted-foreground">Portofolio</td>
            {partnerCols.map((partner) => (
              <td key={`p-${partner.id}`} className="px-2 py-2.5 font-medium">
                {partnerPortfolioCount(partner)} foto
              </td>
            ))}
            {publicCols.map((profile) => (
              <td key={`pf-${profile.slug}`} className="px-2 py-2.5 font-medium">
                {portfolioPhotoCount(profile.portfolio)} foto
              </td>
            ))}
          </tr>
          <tr className="border-t border-foreground/10">
            <td className="py-2.5 pr-3 text-muted-foreground">Rating</td>
            {partnerCols.map((partner) => (
              <td key={`r-${partner.id}`} className="px-2 py-2.5 font-medium">
                ⭐ {partnerRating(partner).toFixed(1)}
              </td>
            ))}
            {publicCols.map((profile) => (
              <td key={`rf-${profile.slug}`} className="px-2 py-2.5 font-medium">
                {typeof profile.rating === "number"
                  ? `⭐ ${profile.rating.toFixed(1)}`
                  : "—"}
              </td>
            ))}
          </tr>
          <tr className="border-t border-foreground/10">
            <td className="py-2.5 pr-3 text-muted-foreground">Harga mulai</td>
            {partnerCols.map((partner) => (
              <td key={`h-${partner.id}`} className="px-2 py-2.5 font-medium">
                {rupiah(partner.share)}
              </td>
            ))}
            {publicCols.map((profile) => {
              const from = startingPrice(profile.services)
              return (
                <td key={`hf-${profile.slug}`} className="px-2 py-2.5 font-medium">
                  {from != null ? rupiah(from) : "—"}
                </td>
              )
            })}
          </tr>
          <tr className="border-t border-foreground/10">
            <td className="py-2.5 pr-3 text-muted-foreground">Lokasi</td>
            {partnerCols.map((partner) => (
              <td key={`l-${partner.id}`} className="px-2 py-2.5 font-medium">
                {partner.city}
              </td>
            ))}
            {publicCols.map((profile) => (
              <td key={`lf-${profile.slug}`} className="px-2 py-2.5 font-medium">
                {profile.city || "—"}
              </td>
            ))}
          </tr>
          <tr className="border-t border-foreground/10">
            <td className="py-2.5 pr-3 text-muted-foreground">Status</td>
            {partnerCols.map((partner) => (
              <td key={`s-${partner.id}`} className="px-2 py-2.5 font-medium">
                {partnerAvailable(partner) ? "Tersedia" : "Padat"}
              </td>
            ))}
            {publicCols.map((profile) => (
              <td key={`sf-${profile.slug}`} className="px-2 py-2.5 font-medium">
                {profile.services.length || profile.portfolio?.length
                  ? "Tersedia"
                  : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  )
}

export default function ClientShortlistPage() {
  const { ready, workspace, toggleShortlist, activeEvent, assignVendor } =
    useClientWorkspace()
  const [publicMap, setPublicMap] = useState<Record<string, PublicBookingProfile>>({})

  useEffect(() => {
    let cancelled = false
    void listDiscoverablePublicProfiles().then((profiles) => {
      if (cancelled) return
      setPublicMap(Object.fromEntries(profiles.map((profile) => [profile.slug, profile])))
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return <StudioLoading />

  const items: ShortItem[] = workspace.shortlist
    .map((id) => {
      const slug = parsePublicVendorShortlistId(id)
      if (slug) {
        const profile = publicMap[slug]
        return profile ? ({ kind: "public", id, profile } as const) : null
      }
      const partner = partnerById(id)
      return partner ? ({ kind: "partner", id, partner } as const) : null
    })
    .filter((item): item is ShortItem => Boolean(item))

  const partners = items
    .filter((item): item is Extract<ShortItem, { kind: "partner" }> => item.kind === "partner")
    .map((item) => item.partner)
  const publics = items
    .filter((item): item is Extract<ShortItem, { kind: "public" }> => item.kind === "public")
    .map((item) => item.profile)

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Pilihan Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simpan vendor (termasuk yang sudah unggah portofolio di app), bandingkan, lalu booking.
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
          <CompareTable partners={partners} publics={publics} />

          <div className="grid gap-3">
            {items.map((item) =>
              item.kind === "public" ? (
                <article
                  key={item.id}
                  className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        <Link
                          href={`/p/${item.profile.slug}`}
                          className="hover:text-primary"
                        >
                          {item.profile.name}
                        </Link>{" "}
                        <Heart className="ml-1 inline size-3.5 fill-primary text-primary" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.profile.city || "Lokasi belum diisi"} ·{" "}
                        {portfolioPhotoCount(item.profile.portfolio)} foto
                      </p>
                      {typeof item.profile.rating === "number" ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-sm">
                          <Star className="size-3.5 fill-current text-primary" />
                          {item.profile.rating.toFixed(1)}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                      onClick={() => toggleShortlist(item.id)}
                    >
                      Hapus
                    </button>
                  </div>
                  {item.profile.bio ? (
                    <p className="text-sm text-muted-foreground">{item.profile.bio}</p>
                  ) : null}
                  <Link
                    href={`/p/${item.profile.slug}`}
                    className={cn(buttonVariants({ variant: "outline" }), "h-10 w-fit")}
                  >
                    Lihat portofolio
                  </Link>
                </article>
              ) : (
                <article
                  key={item.id}
                  className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        <Link
                          href={`/klien/vendor/${item.partner.id}`}
                          className="hover:text-primary"
                        >
                          {item.partner.name}
                        </Link>{" "}
                        <Heart className="ml-1 inline size-3.5 fill-primary text-primary" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tradeLabelForPartner(item.partner)} · {item.partner.area},{" "}
                        {item.partner.city}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-current text-primary" />
                          {partnerRating(item.partner).toFixed(1)}
                        </span>
                        <span>mulai {rupiah(item.partner.share)}</span>
                        <span>{partnerPortfolioCount(item.partner)} foto</span>
                        <span>
                          {partnerAvailable(item.partner) ? "Tersedia" : "Padat"}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                      onClick={() => toggleShortlist(item.id)}
                    >
                      Hapus
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.partner.blurb}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/klien/vendor/${item.partner.id}`}
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
                            item.partner.trade === "makeup"
                              ? "makeup"
                              : item.partner.trade === "hair"
                                ? "hair"
                                : item.partner.trade === "dekor"
                                  ? "dekor"
                                  : item.partner.trade === "baju"
                                    ? "baju"
                                    : item.partner.trade === "content"
                                      ? "content"
                                      : "photo"
                          assignVendor(
                            activeEvent.id,
                            need,
                            item.partner.id,
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
            )}
          </div>
        </>
      )}
    </div>
  )
}
