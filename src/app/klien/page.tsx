"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, MapPin, Search } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { studio } from "@/lib/catalog"
import { partners, TRADE_LABEL } from "@/lib/partners"
import { cn } from "@/lib/utils"

export default function ClientHomePage() {
  const router = useRouter()
  const { ready, user, logout } = useAuth()
  const [query, setQuery] = useState("")

  const city = user?.city || "Bandung"
  const listings = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const inCity = partners.filter((partner) => partner.city === city)
    const pool = inCity.length ? inCity : partners
    if (!needle) return pool.slice(0, 8)
    return pool
      .filter((partner) => {
        const haystack =
          `${partner.name} ${TRADE_LABEL[partner.trade]} ${partner.area} ${partner.blurb}`.toLowerCase()
        return haystack.includes(needle)
      })
      .slice(0, 12)
  }, [city, query])

  if (!ready || !user) return <StudioLoading />

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl">Key Assistant</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Halo, {user.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            Mencari vendor di {city}
          </p>
        </div>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          onClick={() => void logout().then(() => router.replace("/masuk"))}
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </header>

      <section className="mt-8 grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Cari vendor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lihat vendor di sekitarmu, buka pricelist, lalu hubungi lewat WhatsApp.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, jenis jasa, atau area…"
            className="h-11 bg-background pl-10"
          />
        </div>
        {!listings.length ? (
          <p className="rounded-xl bg-muted/50 px-4 py-6 text-sm text-muted-foreground">
            Belum ada vendor yang cocok dengan pencarianmu. Coba kata kunci lain.
          </p>
        ) : (
          <div className="grid gap-3">
            {listings.map((partner) => (
              <article
                key={partner.id}
                className="rounded-2xl bg-background px-4 py-4 ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {TRADE_LABEL[partner.trade]} · {partner.area}, {partner.city}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/62${partner.phone.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ size: "sm" }), "h-9")}
                  >
                    WhatsApp
                  </a>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{partner.blurb}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-2xl">Pricelist contoh</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lihat contoh halaman harga {studio.name} yang bisa dibagikan owner ke klien.
        </p>
        <Link
          href={`/p/${studio.slug}`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-10")}
        >
          Buka pricelist
        </Link>
      </section>
    </div>
  )
}
