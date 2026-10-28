"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, Check } from "lucide-react"

import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { packageById, packages, studio } from "@/lib/catalog"
import { dpFor, formatDate, formatTime, rupiah, waLink } from "@/lib/format"
import type { EventType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3 | 4 | 5

const TIME_OPTIONS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
]

function eventTypeForPackage(packageId: string): EventType {
  if (packageId === "wisuda") return "wisuda"
  if (packageId === "perak") return "engagement"
  return "pengantin"
}

/** Halaman klien untuk link booking mandiri — alur pendek, tanpa flyer pricelist lama. */
export function PublicBookingFlow({ slug }: { slug: string }) {
  const { ready, addBooking } = useStudio()
  const [step, setStep] = useState<Step>(1)
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("08:00")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const selected = packageById(packageId) ?? packages[0]
  const stepsLabel = useMemo(
    () => ["Layanan", "Jadwal", "Kontak", "Ringkasan", "Ajukan"] as const,
    []
  )

  if (slug !== studio.slug) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 text-center">
        <p className="text-sm text-primary">Link booking</p>
        <h1 className="mt-2 text-4xl">Studio ini belum punya halaman</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Alamat yang dibuka tidak cocok. Halaman booking yang tersedia milik {studio.name}.
        </p>
        <Link href={`/p/${studio.slug}`} className="mt-6 text-sm font-medium text-primary">
          Buka link booking {studio.name}
        </Link>
      </main>
    )
  }

  function goNext() {
    setError("")
    if (step === 1 && !selected) {
      setError("Pilih layanan dulu.")
      return
    }
    if (step === 2) {
      if (!date || !time) {
        setError("Pilih tanggal dan waktu.")
        return
      }
    }
    if (step === 3) {
      if (!name.trim() || !phone.trim()) {
        setError("Isi nama dan WhatsApp.")
        return
      }
    }
    setStep((current) => Math.min(5, current + 1) as Step)
  }

  function submitBooking() {
    if (!ready || !selected) return
    if (!name.trim() || !phone.trim() || !date || !time) {
      setError("Lengkapi layanan, jadwal, nama, dan WhatsApp.")
      setStep(1)
      return
    }
    addBooking({
      clientName: name.trim(),
      phone: phone.trim(),
      eventType: eventTypeForPackage(selected.id),
      date,
      time,
      location: "Lokasi menyusul (dikunci owner)",
      packageId: selected.id,
      attireId: null,
      price: selected.price,
      dp: dpFor(selected.price),
      paid: 0,
      notes: "Pengajuan dari link booking mandiri",
      source: "pricelist",
      attireReturned: false,
      approvalStatus: "diajukan",
    })
    setSubmitted(true)
    setError("")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <span className="text-sm text-muted-foreground">Key Assistant</span>
          <a
            href={waLink(studio.phone, `Halo ${studio.name}, saya ingin tanya jadwal.`)}
            className="ml-auto text-sm font-medium text-primary"
          >
            Chat WA
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-lg gap-5 px-4 py-7">
        <div>
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            Ajukan booking · {studio.city}
          </p>
          <h1 className="mt-2 text-4xl">{studio.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cukup 5 langkah. Tombol akhir adalah <strong>Ajukan Booking</strong> — bukan booking
            langsung. {studio.name} akan konfirmasi lewat WhatsApp.
          </p>
        </div>

        {submitted ? (
          <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="font-display text-2xl">Booking berhasil diajukan 🎉</p>
            <p className="text-sm text-muted-foreground">
              Permintaan booking kamu sudah diterima. {studio.name} akan menghubungimu melalui
              WhatsApp untuk konfirmasi jadwal dan pembayaran.
            </p>
            <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">{selected.name}</p>
              <p className="text-muted-foreground">
                {formatDate(date)} · {formatTime(time)}
              </p>
              <p className="text-muted-foreground">
                {name.trim()} · {phone.trim()}
              </p>
            </div>
            <a
              href={waLink(
                studio.phone,
                `Halo ${studio.name}, saya baru mengajukan booking ${selected.name} untuk ${formatDate(date)} jam ${formatTime(time)}.`
              )}
              className={cn(buttonVariants(), "h-11")}
            >
              Chat WhatsApp {studio.name}
            </a>
          </section>
        ) : (
          <>
            <ol className="grid grid-cols-5 gap-1">
              {stepsLabel.map((label, index) => {
                const n = (index + 1) as Step
                const active = step === n
                const done = step > n
                return (
                  <li
                    key={label}
                    className={cn(
                      "rounded-xl px-1 py-2 text-center text-[10px] font-medium sm:text-xs",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="block font-semibold">{n}</span>
                    {label}
                  </li>
                )
              })}
            </ol>

            <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              {step === 1 ? (
                <div className="grid gap-3">
                  <div>
                    <h2 className="font-display text-2xl">1. Pilih layanan</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pilih satu. Detail lain dikonfirmasi owner nanti.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {packages.map((item) => {
                      const active = item.id === selected.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPackageId(item.id)}
                          className={cn(
                            "rounded-xl px-4 py-3 text-left ring-1 transition",
                            active
                              ? "bg-primary/8 ring-primary"
                              : "bg-background ring-foreground/10 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">{item.blurb}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <p className="text-sm font-medium">{rupiah(item.price)}</p>
                              {active ? <Check className="size-4 text-primary" /> : null}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-3">
                  <div>
                    <h2 className="font-display text-2xl">2. Pilih tanggal & waktu</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Owner bisa menyesuaikan jika slot bentrok.
                    </p>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking-date">Tanggal</Label>
                    <Input
                      id="booking-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Waktu</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setTime(option)}
                          className={cn(
                            "h-10 rounded-xl text-sm ring-1 transition",
                            time === option
                              ? "bg-primary text-primary-foreground ring-primary"
                              : "bg-background ring-foreground/10 hover:bg-muted/50"
                          )}
                        >
                          {formatTime(option)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3">
                  <div>
                    <h2 className="font-display text-2xl">3. Nama + WhatsApp</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Hanya data yang dibutuhkan agar owner bisa menghubungi.
                    </p>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking-name">Nama</Label>
                    <Input
                      id="booking-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nama lengkap"
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking-wa">WhatsApp</Label>
                    <Input
                      id="booking-wa"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="08…"
                      inputMode="tel"
                      className="h-11 bg-background"
                    />
                  </div>
                </div>
              ) : null}

              {step === 4 || step === 5 ? (
                <div className="grid gap-3">
                  <div>
                    <h2 className="font-display text-2xl">
                      {step === 4 ? "4. Lihat ringkasan" : "5. Ajukan booking"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ini masih pengajuan. Belum berarti booking diterima.
                    </p>
                  </div>
                  <dl className="grid gap-2 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Layanan</dt>
                      <dd className="text-right font-medium">{selected.name}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Harga</dt>
                      <dd className="font-medium">{rupiah(selected.price)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Jadwal</dt>
                      <dd className="text-right font-medium">
                        {date ? formatDate(date) : "—"} · {formatTime(time)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Nama</dt>
                      <dd className="text-right font-medium">{name.trim() || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">WhatsApp</dt>
                      <dd className="text-right font-medium">{phone.trim() || "—"}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => {
                      setError("")
                      setStep((current) => Math.max(1, current - 1) as Step)
                    }}
                  >
                    <ArrowLeft className="size-4" />
                    Kembali
                  </Button>
                ) : null}
                {step < 5 ? (
                  <Button type="button" className="h-11 flex-1" onClick={goNext}>
                    Lanjut
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 flex-1"
                    disabled={!ready}
                    onClick={submitBooking}
                  >
                    {ready ? "Ajukan Booking" : "Memuat…"}
                  </Button>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
