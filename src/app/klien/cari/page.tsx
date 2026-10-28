"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
import { fieldById } from "@/lib/onboarding"
import { portfolioPhotoCount } from "@/lib/portfolio"
import {
  listDiscoverablePublicProfiles,
  publicVendorShortlistId,
  startingPrice,
  type PublicBookingProfile,
} from "@/lib/public-booking-profile"
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
  const [liveVendors, setLiveVendors] = useState<PublicBookingProfile[]>([])
  const [liveReady, setLiveReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const profiles = await listDiscoverablePublicProfiles()
      if (!cancelled) {
        setLiveVendors(profiles)
        setLiveReady(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const liveListings = useMemo(() => {
    const city = (user?.city || activeEvent?.city || "").trim().toLowerCase()
    const needle = query.trim().toLowerCase()
    return liveVendors
      .filter((profile) => {
        if (needId !== "all") {
          const fields = profile.businessFields || []
          const serviceFields = profile.services.map((service) => service.fieldId)
          const hay = new Set([...fields, ...serviceFields])
          if (!hay.has(needId) && !(needId === "photo" && hay.has("video"))) {
            return false
          }
        }
        if (city && profile.city && profile.city.toLowerCase() !== city) {
          // Tetap tampilkan jika kota kosong di profil
          if (profile.city.trim()) return false
        }
        if (!needle) return true
        const fieldText = (profile.businessFields || [])
          .map((id) => fieldById(id)?.label || id)
          .join(" ")
        const haystack =
          `${profile.name} ${profile.city} ${profile.bio || ""} ${fieldText}`.toLowerCase()
        return haystack.includes(needle)
      })
      .slice(0, 24)
  }, [activeEvent?.city, liveVendors, needId, query, user?.city])

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
          Vendor yang sudah mengunggah portofolio di aplikasi tampil di sini. Simpan ke Pilihan
          Saya untuk dibandingkan.
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

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-medium">Vendor di Key Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Portofolio dari Owner yang sudah mengunggah lewat Menu → Portofolio.
          </p>
        </div>
        {!liveReady ? (
          <p className="text-sm text-muted-foreground">Memuat vendor…</p>
        ) : !liveListings.length ? (
          <p className="rounded-2xl bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Belum ada vendor dengan portofolio/layanan publik. Setelah Owner mengunggah di Menu →
            Portofolio, profilnya muncul di sini dan di link `/p/…`.
          </p>
        ) : (
          <div className="grid gap-3">
            {liveListings.map((profile) => {
              const shortId = publicVendorShortlistId(profile.slug)
              const liked = isShortlisted(shortId)
              const photos = portfolioPhotoCount(profile.portfolio)
              const from = startingPrice(profile.services)
              const fieldLine = (profile.businessFields || [])
                .map((id) => fieldById(id))
                .filter(Boolean)
                .map((field) => `${field!.emoji} ${field!.short}`)
                .join(" · ")
              const thumb =
                profile.portfolio?.[0]?.media?.[0]?.dataUrl || profile.logoDataUrl
              return (
                <article
                  key={profile.slug}
                  className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-foreground/10"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <Link
                          href={`/p/${profile.slug}`}
                          className="font-medium hover:text-primary"
                        >
                          {profile.name}
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                          {typeof profile.rating === "number" ? (
                            <span className="inline-flex items-center gap-1 text-foreground">
                              <Star className="size-3.5 fill-current text-primary" />
                              {profile.rating.toFixed(1)}
                            </span>
                          ) : null}
                          {profile.city ? <span>{profile.city}</span> : null}
                        </p>
                        {fieldLine ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{fieldLine}</p>
                        ) : null}
                        <p className="mt-1 text-sm">
                          {photos > 0 ? `${photos} foto portofolio` : "Portofolio siap dilihat"}
                          {from != null ? ` · mulai ${rupiah(from)}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleShortlist(shortId)}
                      className={cn(
                        buttonVariants({
                          variant: liked ? "default" : "outline",
                          size: "sm",
                        }),
                        "h-9"
                      )}
                    >
                      <Heart className={cn("size-4", liked && "fill-current")} />
                      {liked ? "Tersimpan" : "Simpan"}
                    </button>
                  </div>
                  {profile.bio ? (
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  ) : null}
                  {profile.portfolio?.[0]?.media?.length ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {profile.portfolio
                        .flatMap((item) => item.media)
                        .slice(0, 3)
                        .map((media) =>
                          media.kind === "video" ? (
                            <video
                              key={media.id}
                              src={media.dataUrl}
                              className="aspect-[4/5] rounded-lg object-cover"
                              muted
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={media.id}
                              src={media.dataUrl}
                              alt=""
                              className="aspect-[4/5] rounded-lg object-cover"
                            />
                          )
                        )}
                    </div>
                  ) : null}
                  <Link
                    href={`/p/${profile.slug}`}
                    className={cn(buttonVariants({ variant: "outline" }), "h-10 w-fit")}
                  >
                    Lihat portofolio & layanan
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-medium">Direktori contoh</h2>
          <p className="text-sm text-muted-foreground">
            Vendor contoh untuk mencoba alur Pilihan Saya & bandingkan.
          </p>
        </div>
        {!listings.length ? (
          <p className="rounded-2xl bg-card px-4 py-8 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Belum ada vendor contoh yang cocok. Coba kategori atau kata kunci lain.
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
                        buttonVariants({
                          variant: liked ? "default" : "outline",
                          size: "sm",
                        }),
                        "h-9"
                      )}
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
                          assignVendor(
                            activeEvent.id,
                            nid,
                            partner.id,
                            "menunggu_konfirmasi"
                          )
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
      </section>
    </div>
  )
}
