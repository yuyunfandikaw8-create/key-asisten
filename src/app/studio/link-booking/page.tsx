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
import { studioBrand } from "@/lib/studio-brand"
import { cn } from "@/lib/utils"

const CLIENT_FLOW = [
  "Pilih layanan",
  "Pilih tanggal & waktu",
  "Isi nama + WhatsApp",
  "Lihat ringkasan",
  "Ajukan Booking",
  "Owner menerima booking",
] as const

export default function LinkBookingPage() {
  const { ready: authReady, user } = useAuth()
  const { ready, viewMode } = useStudio()
  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [shareNotice, setShareNotice] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const publicPath = `/p/${brand.slug}`
  const shareUrl = useMemo(
    () => (origin ? `${origin}${publicPath}` : publicPath),
    [origin, publicPath]
  )

  const shareText = useMemo(
    () =>
      [
        `Halo, ini link booking ${brand.name}.`,
        "Pilih layanan, jadwal, lalu ajukan booking — kami yang konfirmasi lewat WhatsApp:",
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
          Alur pendek untuk klien: sedikit isian, lalu kamu yang memutuskan diterima, ditolak,
          atau perlu dikonfirmasi.
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
        </div>

        {shareNotice ? (
          <p className="rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">{shareNotice}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Cocok untuk bio Instagram, broadcast WhatsApp, atau dikirim langsung ke calon klien.
          </p>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-lg font-medium">Alur klien</h2>
        <p className="text-sm text-muted-foreground">
          Jangan membuat klien mengisi terlalu banyak. Tombol di halaman klien adalah{" "}
          <span className="font-medium text-foreground">Ajukan Booking</span> — bukan “Booking
          Sekarang”, karena kamu belum tentu menyetujui.
        </p>
        <ol className="grid gap-2">
          {CLIENT_FLOW.map((item, index) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="pt-1 font-medium">{item}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Setelah diajukan, klien melihat bahwa permintaan sudah diterima dan{" "}
          <span className="font-medium text-foreground">{brand.name}</span> akan menghubungi via
          WhatsApp untuk konfirmasi jadwal dan pembayaran. Pembayaran tetap langsung ke kamu,
          bukan ke Key Assistant.
        </p>
        <Link href="/studio/jadwal?status=pengajuan" className="text-sm font-medium text-primary hover:underline">
          Buka pengajuan di Jadwal →
        </Link>
      </section>
    </div>
  )
}
