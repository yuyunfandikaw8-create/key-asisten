"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, LoaderCircle, X } from "lucide-react"

import { ScheduleFields } from "@/components/schedule-fields"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { attires, packages, SAMPLE_CHAT } from "@/lib/catalog"
import { EVENT_LABEL, formatDate, formatTime } from "@/lib/format"
import { conflictsFor } from "@/lib/metrics"
import { parseChat } from "@/lib/parse-chat"
import { extractTextFromChatImage, isChatImageFile } from "@/lib/read-chat-image"
import type { EventType } from "@/lib/types"
import { cn } from "@/lib/utils"

function resolveEventType(label: string): EventType {
  const needle = label.trim().toLowerCase()
  const matched = (Object.entries(EVENT_LABEL) as [EventType, string][]).find(
    ([key, value]) => value.toLowerCase() === needle || key === needle
  )
  return matched?.[0] ?? "pengantin"
}

function resolvePackage(label: string) {
  const needle = label.trim().toLowerCase()
  return packages.find(
    (item) => item.name.toLowerCase() === needle || item.id === needle
  )
}

function resolveAttire(label: string) {
  const needle = label.trim().toLowerCase()
  if (!needle) return null
  return (
    attires.find(
      (item) => item.name.toLowerCase() === needle || item.id === needle
    ) ?? null
  )
}

export default function NewBookingPage() {
  const router = useRouter()
  const { ready, bookings, addBooking } = useStudio()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [chat, setChat] = useState("")
  const [found, setFound] = useState<string[]>([])
  const [parseError, setParseError] = useState("")
  const [formError, setFormError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [acara, setAcara] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState("")
  const [paket, setPaket] = useState("")
  const [priceAmount, setPriceAmount] = useState("")
  const [dpAmount, setDpAmount] = useState("")
  const [gaun, setGaun] = useState("")
  const [notes, setNotes] = useState("")
  const [screenshotName, setScreenshotName] = useState("")
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)
  const [readingImage, setReadingImage] = useState(false)
  const [dragging, setDragging] = useState(false)

  const matchedAttire = resolveAttire(gaun)
  const clashes = useMemo(() => {
    if (!date || !time) return []
    return conflictsFor(bookings, {
      date,
      time,
      attireId: matchedAttire?.id ?? null,
    })
  }, [bookings, date, matchedAttire?.id, time])

  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    }
  }, [screenshotPreview])

  function applyChat(source: string) {
    const parsed = parseChat(source)
    if (!parsed.found.length) {
      setFound([])
      setParseError(
        "Belum kebaca. Pastikan screenshot/teks memuat nama, tanggal, atau jam — atau isi form manual."
      )
      return
    }
    setParseError("")
    setFound(parsed.found)
    if (parsed.clientName) setClientName(parsed.clientName)
    if (parsed.phone) setPhone(parsed.phone)
    if (parsed.date) setDate(parsed.date)
    if (parsed.time) setTime(parsed.time)
    if (parsed.location) setLocation(parsed.location)
    // Acara, paket, dan DP sengaja tidak diisi otomatis — owner yang memilih.
  }

  async function readScreenshot(file: File) {
    if (!isChatImageFile(file)) {
      setParseError("Unggah file gambar (PNG, JPG, atau WEBP).")
      return
    }

    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    const preview = URL.createObjectURL(file)
    setScreenshotPreview(preview)
    setScreenshotName(file.name || "screenshot-chat")
    setReadingImage(true)
    setOcrProgress(0)
    setParseError("")
    setFound([])

    try {
      const text = await extractTextFromChatImage(file, setOcrProgress)
      if (!text.trim()) {
        setParseError(
          "Teks di screenshot tidak terbaca. Coba foto lebih terang/jelas, atau tempel chat sebagai teks."
        )
        return
      }
      setChat(text)
      applyChat(text)
    } catch {
      setParseError("Gagal membaca screenshot. Coba lagi atau tempel chat sebagai teks.")
    } finally {
      setReadingImage(false)
      setOcrProgress(null)
    }
  }

  function clearScreenshot() {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    setScreenshotName("")
  }

  function save() {
    if (!clientName.trim() || !date || !time) {
      setFormError("Nama, tanggal, dan jam wajib diisi.")
      return
    }
    if (!acara.trim()) {
      setFormError("Isi jenis acara dulu.")
      return
    }
    if (!paket.trim()) {
      setFormError("Isi nama paket dulu.")
      return
    }
    const matchedPackage = resolvePackage(paket)
    const priceValue =
      matchedPackage?.price ?? (Number(priceAmount.replace(/\D/g, "")) || 0)
    if (!priceValue) {
      setFormError("Isi harga paket dulu.")
      return
    }
    if (!dpAmount.trim()) {
      setFormError("Isi nominal DP dulu.")
      return
    }
    setFormError("")
    if (clashes.length) {
      setConfirmOpen(true)
      return
    }
    commit()
  }

  function commit() {
    const acaraLabel = acara.trim()
    const paketLabel = paket.trim()
    const gaunLabel = gaun.trim()
    const matchedPackage = resolvePackage(paketLabel)
    const attire = resolveAttire(gaunLabel)
    const priceValue =
      matchedPackage?.price ?? (Number(priceAmount.replace(/\D/g, "")) || 0)
    const dpValue = Number(dpAmount.replace(/\D/g, "")) || 0
    const eventType = resolveEventType(acaraLabel)

    const booking = addBooking({
      clientName: clientName.trim(),
      phone: phone.trim(),
      eventType,
      eventLabel: acaraLabel,
      date,
      time,
      location: location.trim() || "Lokasi menyusul",
      packageId: matchedPackage?.id ?? "custom",
      packageName: paketLabel,
      attireId: attire?.id ?? (gaunLabel ? "custom" : null),
      attireName: gaunLabel || undefined,
      price: priceValue,
      dp: Math.min(dpValue, priceValue),
      paid: 0,
      notes: notes.trim(),
      source: chat.trim() || screenshotName ? "chat" : "studio",
      attireReturned: false,
    })
    router.push(`/studio/invoice/${booking.id}`)
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Booking baru</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Tempel chat WhatsApp/Instagram, atau unggah screenshot — lalu periksa isiannya dan
          simpan.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <Label htmlFor="chat">Chat WhatsApp / Instagram</Label>

          <div
            className={cn(
              "rounded-xl border border-dashed px-3 py-3 transition",
              dragging
                ? "border-primary bg-accent/50"
                : "border-foreground/15 bg-background"
            )}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              if (event.currentTarget.contains(event.relatedTarget as Node)) return
              setDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              const file = event.dataTransfer.files?.[0]
              if (file) void readScreenshot(file)
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={readingImage || !ready}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Unggah screenshot
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (file) void readScreenshot(file)
                }}
              />
              <p className="text-xs text-muted-foreground">
                WA atau Instagram · tarik gambar ke sini, tempel (Ctrl+V), atau pilih file
              </p>
            </div>

            {screenshotPreview ? (
              <div className="relative mt-3 overflow-hidden rounded-lg ring-1 ring-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotPreview}
                  alt={screenshotName || "Screenshot chat"}
                  className="max-h-48 w-full object-contain bg-[oklch(0.97_0.01_20)]"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 ring-1 ring-foreground/10"
                  onClick={clearScreenshot}
                  aria-label="Hapus screenshot"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : null}

            {readingImage ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Membaca screenshot
                {typeof ocrProgress === "number" ? ` · ${ocrProgress}%` : "…"}
              </p>
            ) : null}
          </div>

          <Textarea
            id="chat"
            value={chat}
            onChange={(event) => setChat(event.target.value)}
            onPaste={(event) => {
              const items = event.clipboardData?.items
              if (!items) return
              for (const item of items) {
                if (item.type.startsWith("image/")) {
                  event.preventDefault()
                  const file = item.getAsFile()
                  if (file) void readScreenshot(file)
                  return
                }
              }
            }}
            placeholder="Tempel chat teks di sini, atau tempel/unggah screenshot WA maupun Instagram"
            className="min-h-40 bg-background"
            disabled={readingImage}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => applyChat(chat)}
              disabled={!chat.trim() || !ready || readingImage}
            >
              Baca chat
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={readingImage}
              onClick={() => {
                clearScreenshot()
                setChat(SAMPLE_CHAT)
                applyChat(SAMPLE_CHAT)
              }}
            >
              Isi contoh chat
            </Button>
          </div>
          {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}
          {found.length ? (
            <p className="text-sm text-muted-foreground">Terbaca: {found.join(", ")}.</p>
          ) : null}
        </section>

        <form
          className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="nama">Nama klien</Label>
            <Input
              id="nama"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hp">WhatsApp</Label>
            <Input
              id="hp"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10 bg-background"
              placeholder="08…"
            />
          </div>
          <ScheduleFields
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            inputClassName="bg-background"
          />
          <div className="grid gap-1.5">
            <Label htmlFor="acara">Acara</Label>
            <Input
              id="acara"
              value={acara}
              onChange={(event) => setAcara(event.target.value)}
              placeholder="Contoh: Rias pengantin"
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="paket">Paket</Label>
            <Input
              id="paket"
              value={paket}
              onChange={(event) => setPaket(event.target.value)}
              placeholder="Contoh: Paket Emas"
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="harga">Harga paket</Label>
            <Input
              id="harga"
              value={priceAmount}
              onChange={(event) => setPriceAmount(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Nominal harga"
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dp">DP</Label>
            <Input
              id="dp"
              value={dpAmount}
              onChange={(event) => setDpAmount(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Nominal DP"
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gaun">Gaun</Label>
            <Input
              id="gaun"
              value={gaun}
              onChange={(event) => setGaun(event.target.value)}
              placeholder="Kosongkan jika tidak pakai gaun studio"
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lokasi">Lokasi</Label>
            <Input
              id="lokasi"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-10 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea
              id="catatan"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-20 bg-background"
            />
          </div>
          {clashes.length ? (
            <p className="text-sm text-destructive">
              Bentrok dengan {clashes.map((item) => item.clientName).join(", ")} pada{" "}
              {formatDate(date)} pukul {formatTime(time)}.
            </p>
          ) : null}
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <Button type="submit" disabled={!ready || readingImage} className="h-10">
            Simpan jadwal
          </Button>
        </form>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwal ini bentrok</DialogTitle>
            <DialogDescription>
              {clashes.map((item) => item.clientName).join(", ")} sudah ada di tanggal yang sama.
              Simpan hanya kalau klien ini memang disengaja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Kembali
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                commit()
              }}
            >
              Simpan tetap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
