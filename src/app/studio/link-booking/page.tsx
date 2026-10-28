"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, Copy, ExternalLink, Share2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { waLink } from "@/lib/format"
import { DEMO_BOOKING_SERVICES, publishFromOwner } from "@/lib/public-booking-profile"
import { studioBrand } from "@/lib/studio-brand"
import { cn } from "@/lib/utils"

export default function LinkBookingPage() {
  const { ready: authReady, user } = useAuth()
  const { ready, viewMode } = useStudio()
  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [shareNotice, setShareNotice] = useState("")
  const serviceCount =
    viewMode === "demo" ? DEMO_BOOKING_SERVICES.length : (user?.services?.length ?? 0)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!authReady || !ready) return
    publishFromOwner(user, { demo: viewMode === "demo" })
  }, [authReady, ready, user, viewMode])

  const publicPath = `/p/${brand.slug}`
  const shareUrl = useMemo(
    () => (origin ? `${origin}${publicPath}` : publicPath),
    [origin, publicPath]
  )

  const shareText = useMemo(
    () =>
      [
        `Halo, ini link booking ${brand.name}.`,
        "Ajukan booking lewat link ini — kami konfirmasi via WhatsApp:",
        shareUrl,
      ].join("\n"),
    [brand.name, shareUrl]
  )

  async function copyLink() {
    setShareNotice("")
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setShareNotice("Gagal menyalin. Salin manual dari kotak link.")
    }
  }

  async function shareLink() {
    setShareNotice("")
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Booking ${brand.name}`,
          text: `Ajukan booking lewat link ${brand.name}`,
          url: shareUrl,
        })
        setShareNotice("Link dibagikan.")
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    window.open(waLink(brand.phone, shareText), "_blank", "noopener,noreferrer")
  }

  if (!ready || !authReady) return <StudioLoading />

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <Link
          href="/studio/menu"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
        <h1 className="text-4xl">Link booking mandiri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Salin dan bagikan link ke calon klien. Pengajuan muncul di Jadwal.
          {viewMode === "demo"
            ? ` Mode contoh menampilkan ${serviceCount} paket contoh + harga di halaman klien.`
            : serviceCount > 0
              ? ` Halaman klien menampilkan ${serviceCount} layanan yang kamu siapkan.`
              : " Tambah layanan + harga di menu Layanan agar muncul di halaman klien."}
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="grid gap-1.5">
          <Label htmlFor="booking-link">Link untuk dibagikan</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="booking-link"
              readOnly
              value={shareUrl}
              className="h-10 flex-1 bg-background font-mono text-sm"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => void copyLink()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Tersalin" : "Salin"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-10" onClick={() => void shareLink()}>
            <Share2 className="size-4" />
            Bagikan ke klien
          </Button>
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          >
            <ExternalLink className="size-4" />
            Buka halaman klien
          </a>
          <Link
            href="/studio/jadwal?status=pengajuan"
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          >
            Lihat pengajuan
          </Link>
        </div>

        {shareNotice ? (
          <p className="rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">{shareNotice}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Cocok untuk bio Instagram, broadcast WhatsApp, atau dikirim langsung ke calon klien.
          </p>
        )}
      </section>
    </div>
  )
}
