"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ExternalLink, Images } from "lucide-react"

import { PortfolioEditor } from "@/components/portfolio-editor"
import { StudioLoading } from "@/components/studio-bits"
import { useAuth } from "@/components/auth-provider"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { portfolioPhotoCount } from "@/lib/portfolio"
import { publishFromOwner } from "@/lib/public-booking-profile"
import { studioBrand } from "@/lib/studio-brand"
import { cn } from "@/lib/utils"

export default function StudioPortofolioPage() {
  const { ready: authReady, user } = useAuth()
  const { ready, viewMode } = useStudio()
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!authReady || !ready || !user) return
    publishFromOwner(user, { demo: viewMode === "demo" })
  }, [authReady, ready, user, viewMode])

  if (!ready || !authReady) return <StudioLoading />

  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const publicPath = `/p/${brand.slug}`
  const publicUrl = origin ? `${origin}${publicPath}` : publicPath
  const visiblePhotos = portfolioPhotoCount(
    viewMode === "demo" ? brand.portfolio : user?.portfolio
  )

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <Link
          href="/studio/menu"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Menu
        </Link>
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.94_0.04_35)] text-[oklch(0.45_0.12_25)]">
            <Images className="size-5" />
          </span>
          <div>
            <h1 className="text-4xl">Portofolio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Unggah hasil pekerjaan dari Menu. Yang kamu tampilkan bisa dilihat klien di profil
              publik.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Ditampilkan ke klien</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visiblePhotos > 0
                ? `${visiblePhotos} foto/video tampil di profil publik.`
                : "Belum ada item tampil. Tambah portofolio dan pastikan status Tampilkan aktif."}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{publicUrl}</p>
          </div>
          <Link
            href={publicPath}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 shrink-0")}
          >
            <ExternalLink className="size-4" />
            Lihat sebagai klien
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <PortfolioEditor />
      </div>
    </div>
  )
}
