"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, MapPin, MessageCircle, Star } from "lucide-react"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  partnerById,
  tradeLabelForPartner,
  type ClientNeedId,
} from "@/lib/client-workspace"
import { rupiah, waLink } from "@/lib/format"
import {
  partnerAvailable,
  partnerFieldId,
  partnerPortfolioCount,
  partnerRating,
} from "@/lib/partners"
import { formatPortfolioDate, portfolioCategoryLabel } from "@/lib/portfolio"
import { showcasePortfolio, showcaseServices } from "@/lib/vendor-showcase"
import { cn } from "@/lib/utils"

export default function ClientVendorDetailPage() {
  const params = useParams<{ id: string }>()
  const { ready, toggleShortlist, isShortlisted, activeEvent, assignVendor } =
    useClientWorkspace()
  const partner = partnerById(String(params.id || ""))

  if (!ready) return <StudioLoading />

  if (!partner) {
    return (
      <div className="grid gap-4">
        <Link href="/klien/cari" className="text-sm text-muted-foreground">
          ← Kembali
        </Link>
        <p className="text-sm text-muted-foreground">Vendor tidak ditemukan.</p>
      </div>
    )
  }

  const liked = isShortlisted(partner.id)
  const rating = partnerRating(partner)
  const photos = partnerPortfolioCount(partner)
  const available = partnerAvailable(partner)
  const portfolio = showcasePortfolio(partner)
  const services = showcaseServices(partner)
  const needId = partnerFieldId(partner.trade) as ClientNeedId
  const contact = waLink(
    partner.phone,
    `Halo ${partner.name}, saya tertarik dengan layanan Anda di Key Assistant.`
  )

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/klien/cari"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Cari Vendor
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl">{partner.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="size-3.5 fill-current text-primary" />
                {rating.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {partner.area}, {partner.city}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tradeLabelForPartner(partner)} · {photos} foto ·{" "}
              {available ? "Tersedia" : "Padat"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleShortlist(partner.id)}
            className={cn(
              buttonVariants({ variant: liked ? "default" : "outline" }),
              "h-10"
            )}
          >
            <Heart className={cn("size-4", liked && "fill-current")} />
            {liked ? "Di Pilihan Saya" : "Pilihan Saya"}
          </button>
        </div>
      </div>

      <section className="grid gap-2">
        <h2 className="text-lg font-medium">Tentang</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{partner.blurb}</p>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-medium">Portofolio</h2>
          <p className="text-sm text-muted-foreground">Cuplikan hasil pekerjaan vendor.</p>
        </div>
        <div className="grid gap-4">
          {portfolio.map((item) => (
            <article key={item.id} className="grid gap-2">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {portfolioCategoryLabel(item.category)}
                  {item.description ? ` · ${item.description}` : ""}
                  {item.date ? ` · ${formatPortfolioDate(item.date)}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {item.media.map((media) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={media.id}
                    src={media.dataUrl}
                    alt={item.title}
                    className="aspect-[4/5] rounded-xl object-cover ring-1 ring-foreground/10"
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-medium">Layanan</h2>
          <p className="text-sm text-muted-foreground">Harga mulai dari contoh paket vendor.</p>
        </div>
        <div className="grid gap-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
            >
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">{service.blurb}</p>
              </div>
              <p className="shrink-0 text-sm font-medium">{rupiah(service.price)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 pb-4">
        {activeEvent ? (
          <button
            type="button"
            className={cn(buttonVariants(), "h-11 flex-1")}
            onClick={() =>
              assignVendor(activeEvent.id, needId, partner.id, "menunggu_konfirmasi")
            }
          >
            Pilih untuk {activeEvent.title}
          </button>
        ) : (
          <Link href="/klien/acara" className={cn(buttonVariants(), "h-11 flex-1")}>
            Buat acara dulu
          </Link>
        )}
        <a
          href={contact}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1")}
        >
          <MessageCircle className="size-4" />
          Hubungi
        </a>
      </div>
    </div>
  )
}
