"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, LoaderCircle, X } from "lucide-react"

import { ScheduleFields } from "@/components/schedule-fields"
import { SuggestInput, type SuggestOption } from "@/components/suggest-input"
import { useAuth } from "@/components/auth-provider"
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
import { EVENT_LABEL, formatDate, formatTime, rupiah } from "@/lib/format"
import { conflictsFor } from "@/lib/metrics"
import { fieldById } from "@/lib/onboarding"
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
  const { user } = useAuth()
  const { ready, bookings, addBooking, viewMode } = useStudio()
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

  const ownerServices = user?.services ?? []
  const demoMode = viewMode === "demo"

  const acaraOptions = useMemo<SuggestOption[]>(() => {
    const fromEvents = (Object.values(EVENT_LABEL) as string[]).map((label) => ({
      value: label,
      label,
    }))
    const fromFields = (user?.businessFields ?? [])
      .map((id) => fieldById(id))
      .filter(Boolean)
      .map((field) => ({
        value: field!.label,
        label: `${field!.emoji} ${field!.label}`,
      }))
    const fromServices = ownerServices.map((service) => ({
      value: service.name,
      label: service.name,
      hint: fieldById(service.fieldId)?.short,
    }))
    const merged = [...fromEvents, ...fromFields, ...fromServices]
    const seen = new Set<string>()
    return merged.filter((option) => {
      const key = option.value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [ownerServices, user?.businessFields])

  // Paket & harga hanya dari layanan step 5 owner. Data contoh tetap pakai katalog.
  const paketOptions = useMemo<SuggestOption[]>(() => {
    if (!demoMode) {
      return ownerServices.map((service) => ({
        value: service.name,
        label: service.name,
        hint: `${rupiah(service.price)}${
          service.durationHours > 0 ? ` · ${service.durationHours} jam` : ""
        } · ${fieldById(service.fieldId)?.short ?? service.fieldId}`,
      }))
    }
    return packages.map((item) => ({
      value: item.name,
      label: item.name,
      hint: rupiah(item.price),
    }))
  }, [demoMode, ownerServices])

  const hargaOptions = useMemo<SuggestOption[]>(() => {
    const amounts = new Set<number>()
    if (!demoMode) {
      for (const service of ownerServices) {
        if (service.price > 0) amounts.add(service.price)
      }
    } else {
      for (const item of packages) amounts.add(item.price)
    }
    return [...amounts]
      .sort((a, b) => a - b)
      .map((amount) => ({
        value: String(amount),
        label: rupiah(amount),
      }))
  }, [demoMode, ownerServices])

  const gaunOptions = useMemo<SuggestOption[]>(() => {
    if (!demoMode) {
      return ownerServices
        .filter((service) => service.fieldId === "baju")
        .map((service) => ({
          value: service.name,
          label: service.name,
          hint: service.price > 0 ? rupiah(service.price) : undefined,
        }))
    }
    return attires.map((item) => ({
      value: item.name,
      label: item.name,
      hint: item.category,
    }))
  }, [demoMode, ownerServices])

  const matchedAttire = resolveAttire(gaun)
  const clashes = useMemo(() => {
    if (!date || !time) return []
    return conflictsFor(bookings, {
      date,
      time,
      attireId: matchedAttire?.id ?? null,
    })
  }, [bookings, date, matchedAttire?.id, time])

  function pickPaket(option: SuggestOption) {
    setPaket(option.value)
    const fromOwner = ownerServices.find(
      (service) => service.name.toLowerCase() === option.value.toLowerCase()
    )
    if (fromOwner?.price) {
      setPriceAmount(String(fromOwner.price))
      return
    }
    if (!demoMode) return
    const fromCatalog = packages.find(
      (item) => item.name.toLowerCase() === option.value.toLowerCase()
    )
    if (fromCatalog) setPriceAmount(String(fromCatalog.price))
  }

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
    const priceValue = Number(priceAmount.replace(/\D/g, "")) || 0
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
    const fromOwner = ownerServices.find(
      (service) => service.name.toLowerCase() === paketLabel.toLowerCase()
    )
    const matchedPackage = demoMode ? resolvePackage(paketLabel) : undefined
    const attire = resolveAttire(gaunLabel)
    const priceValue =
      Number(priceAmount.replace(/\D/g, "")) ||
      fromOwner?.price ||
      matchedPackage?.price ||
      0
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
      packageId: matchedPackage?.id ?? (fromOwner ? fromOwner.id : "custom"),
      packageName: paketLabel,
      attireId: attire?.id ?? (gaunLabel ? "custom" : null),
      attireName: gaunLabel || undefined,
      price: priceValue,
      dp: Math.min(dpValue, priceValue),
      paid: 0,
      notes: notes.trim(),
      source: chat.trim() || screenshotName ? "chat" : "studio",
      attireReturned: false,
      approvalStatus: "diterima",
      // Default: semua metode aktif di Keuangan; bisa diubah di halaman invoice.
      invoicePaymentMethods: demoMode
        ? ["transfer", "qris"]
        : [...(user?.paymentSettings?.methods ?? [])],
    })
    router.push(`/studio/invoice/${booking.id}`)
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Booking baru</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Tempel chat WhatsApp/Instagram, atau unggah screenshot — lalu periksa dan simpan.
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
                Tempel atau pilih file
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
            placeholder="Tempel chat teks disini atau unggah screenshot WhatsApp maupun Instagram"
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
            <SuggestInput
              id="acara"
              value={acara}
              onChange={setAcara}
              options={acaraOptions}
              placeholder="Pilih atau ketik acara"
              aria-label="Acara"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="paket">Paket</Label>
            <SuggestInput
              id="paket"
              value={paket}
              onChange={setPaket}
              onPick={pickPaket}
              options={paketOptions}
              placeholder={
                !demoMode && !ownerServices.length
                  ? "Belum ada layanan — isi Manual atau tambah di Menu → Layanan"
                  : "Pilih layanan/paket atau ketik sendiri"
              }
              emptyText={
                !demoMode && !ownerServices.length
                  ? "Belum ada layanan dari langkah 5. Ketik manual, atau tambah di Menu → Layanan & harga."
                  : undefined
              }
              aria-label="Paket"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="harga">Harga paket</Label>
            <SuggestInput
              id="harga"
              value={priceAmount}
              onChange={setPriceAmount}
              options={hargaOptions}
              placeholder={
                !demoMode && !hargaOptions.length
                  ? "Isi nominal — terisi otomatis jika pilih layanan"
                  : "Pilih atau isi nominal harga"
              }
              emptyText={
                !demoMode && !hargaOptions.length
                  ? "Belum ada harga layanan. Isi nominal manual."
                  : undefined
              }
              inputMode="numeric"
              filterDigits
              aria-label="Harga paket"
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
            <SuggestInput
              id="gaun"
              value={gaun}
              onChange={setGaun}
              options={gaunOptions}
              placeholder="Pilih gaun/attire atau ketik sendiri"
              aria-label="Gaun"
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
