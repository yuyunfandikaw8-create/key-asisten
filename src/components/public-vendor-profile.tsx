"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { MapPin, MessageCircle, Star } from "lucide-react"

import { PublicBookingFlow } from "@/components/public-booking"
import { useAuth } from "@/components/auth-provider"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { studio } from "@/lib/catalog"
import { fieldById, type BusinessFieldId } from "@/lib/onboarding"
import {
  formatPortfolioDate,
  portfolioCategoryLabel,
  portfolioPhotoCount,
  type PortfolioItem,
} from "@/lib/portfolio"
import {
  loadPublicBookingProfile,
  publishFromOwner,
  startingPrice,
  type PublicBookingProfile,
  type PublicBookingService,
} from "@/lib/public-booking-profile"
import { rupiah, waLink } from "@/lib/format"
import { cn } from "@/lib/utils"

type Tab = "profil" | "booking"

function fieldSummary(
  fields: BusinessFieldId[] | undefined,
  custom?: { id: string; label: string; emoji: string; short: string }[]
) {
  if (!fields?.length) return null
  return fields
    .map((id) => fieldById(id, custom))
    .filter(Boolean)
    .map((field) => `${field!.emoji} ${field!.short}`)
    .join(" · ")
}

function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [active, setActive] = useState<PortfolioItem | null>(null)

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Owner belum menampilkan portofolio publik.
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-5">
        {items.map((item) => (
          <article key={item.id} className="grid gap-2">
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {portfolioCategoryLabel(item.category)}
                {item.description ? ` · ${item.description}` : ""}
                {item.date ? ` · ${formatPortfolioDate(item.date)}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {item.media.map((media) => (
                <button
                  key={media.id}
                  type="button"
                  className="aspect-[4/5] overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
                  onClick={() => setActive(item)}
                >
                  {media.kind === "video" ? (
                    <video src={media.dataUrl} className="size-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media.dataUrl}
                      alt={item.title}
                      className="size-full object-cover transition duration-500 hover:scale-105"
                    />
                  )}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-medium">{active.title}</p>
            <p className="text-sm text-muted-foreground">{active.description}</p>
            <div className="mt-3 grid gap-2">
              {active.media.map((media) =>
                media.kind === "video" ? (
                  <video
                    key={media.id}
                    src={media.dataUrl}
                    className="w-full rounded-xl"
                    controls
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={media.id}
                    src={media.dataUrl}
                    alt={active.title}
                    className="w-full rounded-xl object-cover"
                  />
                )
              )}
            </div>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-10 w-full")}
              onClick={() => setActive(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ServiceList({
  services,
  onBook,
}: {
  services: PublicBookingService[]
  onBook: () => void
}) {
  if (!services.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Layanan belum dipublikasikan. Hubungi vendor untuk info harga.
      </p>
    )
  }
  return (
    <div className="grid gap-2">
      {services.map((service) => {
        const field = fieldById(service.fieldId)
        return (
          <div
            key={service.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3"
          >
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                {[field ? `${field.emoji} ${field.short}` : null, service.blurb]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">{rupiah(service.price)}</p>
          </div>
        )
      })}
      <button type="button" className={cn(buttonVariants(), "mt-2 h-11")} onClick={onBook}>
        Pilih Vendor / Ajukan Booking
      </button>
    </div>
  )
}

export function PublicVendorProfile({ slug }: { slug: string }) {
  const { ready: authReady, user } = useAuth()
  const { ready, viewMode } = useStudio()
  const [tab, setTab] = useState<Tab>("profil")
  const [profile, setProfile] = useState<PublicBookingProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authReady || !ready) return
    let cancelled = false

    async function boot() {
      setLoading(true)
      if (viewMode === "demo") {
        const published = publishFromOwner(user, { demo: true })
        if (!cancelled) {
          setProfile(published)
          setLoading(false)
        }
        return
      }
      if (user?.role === "owner" && (user.services?.length || user.portfolio?.length)) {
        publishFromOwner(user)
      }
      const published = await loadPublicBookingProfile(slug)
      if (cancelled) return
      if (published) {
        setProfile(published)
      } else if (user?.role === "owner") {
        setProfile(publishFromOwner(user))
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [authReady, ready, slug, user, viewMode])

  const photoCount = useMemo(
    () => portfolioPhotoCount(profile?.portfolio),
    [profile?.portfolio]
  )
  const fromPrice = startingPrice(profile?.services)
  const tradeLine = fieldSummary(profile?.businessFields)
  const contactHref = profile?.phone
    ? waLink(
        profile.phone,
        `Halo ${profile.name}, saya tertarik dengan layanan Anda di Key Assistant.`
      )
    : undefined

  if (tab === "booking") {
    return (
      <div>
        <div className="border-b bg-background">
          <div className="mx-auto flex h-12 max-w-lg items-center px-4">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setTab("profil")}
            >
              ← Kembali ke profil
            </button>
          </div>
        </div>
        <PublicBookingFlow slug={slug} />
      </div>
    )
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-muted-foreground">
        Memuat profil publik…
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 text-center">
        <p className="text-sm text-primary">Profil publik</p>
        <h1 className="mt-2 text-4xl">Belum tersedia</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vendor ini belum mempublikasikan layanan atau portofolio. Coba contoh{" "}
          {studio.name}.
        </p>
        <Link href={`/p/${studio.slug}`} className="mt-6 text-sm font-medium text-primary">
          Buka profil {studio.name}
        </Link>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <span className="text-sm text-muted-foreground">Key Assistant</span>
          <Link href="/klien/cari" className="text-sm text-primary">
            Cari vendor
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-lg gap-6 px-4 py-7">
        <section className="grid gap-3">
          <div className="flex items-start gap-3">
            {profile.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoDataUrl}
                alt=""
                className="size-16 rounded-2xl object-cover ring-1 ring-foreground/10"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-medium text-primary">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-4xl leading-tight">{profile.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                {typeof profile.rating === "number" ? (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Star className="size-3.5 fill-current text-primary" />
                    {profile.rating.toFixed(1)}
                  </span>
                ) : null}
                {profile.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {profile.city}
                  </span>
                ) : null}
              </p>
              {tradeLine ? (
                <p className="mt-1 text-sm text-muted-foreground">{tradeLine}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {photoCount > 0 ? <span>{photoCount} foto portofolio</span> : null}
            {fromPrice != null ? <span>· mulai {rupiah(fromPrice)}</span> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(buttonVariants(), "h-11 flex-1")}
              onClick={() => setTab("booking")}
            >
              Ajukan Booking
            </button>
            {contactHref ? (
              <a
                href={contactHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1")}
              >
                <MessageCircle className="size-4" />
                Hubungi
              </a>
            ) : null}
          </div>
        </section>

        {profile.bio ? (
          <section className="grid gap-2">
            <h2 className="text-lg font-medium">Tentang</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          </section>
        ) : null}

        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-medium">Portofolio</h2>
            <p className="text-sm text-muted-foreground">Hasil pekerjaan yang ditampilkan owner.</p>
          </div>
          <PortfolioGallery items={profile.portfolio ?? []} />
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-medium">Layanan & harga</h2>
            <p className="text-sm text-muted-foreground">Pilih layanan lalu ajukan booking.</p>
          </div>
          <ServiceList services={profile.services} onBook={() => setTab("booking")} />
        </section>

        {(profile.address || profile.city) && (
          <section className="grid gap-2">
            <h2 className="text-lg font-medium">Lokasi</h2>
            <p className="text-sm text-muted-foreground">
              {[profile.address, profile.city].filter(Boolean).join(" · ")}
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
