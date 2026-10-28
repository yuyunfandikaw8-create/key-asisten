"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { ScheduleFields } from "@/components/schedule-fields"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { studio } from "@/lib/catalog"
import { dpFor, formatDate, formatTime, rupiah, waLink } from "@/lib/format"
import type { BusinessFieldId } from "@/lib/onboarding"
import { fieldById } from "@/lib/onboarding"
import {
  DEMO_BOOKING_SERVICES,
  publishFromOwner,
  readPublicBookingProfile,
  type PublicBookingService,
} from "@/lib/public-booking-profile"
import type { EventType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3 | 4 | 5

function eventTypeForField(fieldId: BusinessFieldId | undefined): EventType {
  if (fieldId === "photo" || fieldId === "video" || fieldId === "content") return "prewedding"
  if (fieldId === "dekor") return "pesta"
  return "pengantin"
}

function serviceBlurb(service: PublicBookingService) {
  if (service.blurb?.trim()) return service.blurb.trim()
  const field = fieldById(service.fieldId)?.short
  const hours =
    service.durationHours > 0 ? `${service.durationHours} jam` : null
  return [field, hours].filter(Boolean).join(" · ")
}

function toPublicServices(
  items: {
    id: string
    name: string
    price: number
    durationHours: number
    fieldId: BusinessFieldId
    blurb?: string
    details?: string
  }[]
): PublicBookingService[] {
  return items
    .filter((service) => service.name.trim() && service.price > 0)
    .map((service) => {
      const blurb = service.details?.trim() || service.blurb?.trim()
      return {
        id: service.id,
        name: service.name.trim(),
        price: service.price,
        durationHours: service.durationHours || 0,
        fieldId: service.fieldId,
        ...(blurb ? { blurb } : {}),
      }
    })
}

/** Halaman klien untuk link booking mandiri — alur pendek, tanpa flyer pricelist lama. */
export function PublicBookingFlow({ slug }: { slug: string }) {
  const { ready, addBooking, viewMode } = useStudio()
  const { ready: authReady, user } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [serviceId, setServiceId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("08:00")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [studioName, setStudioName] = useState(studio.name)
  const [studioPhone, setStudioPhone] = useState(studio.phone)
  const [services, setServices] = useState<PublicBookingService[]>([])
  const [profileReady, setProfileReady] = useState(false)
  const isDemo = viewMode === "demo"

  const stepsLabel = useMemo(
    () => ["Layanan", "Jadwal", "Data diri", "Ringkasan", "Ajukan"] as const,
    []
  )

  useEffect(() => {
    if (!authReady || !ready) return

    function applyServices(
      nextName: string,
      nextPhone: string,
      nextServices: PublicBookingService[]
    ) {
      setStudioName(nextName)
      setStudioPhone(nextPhone)
      setServices(nextServices)
      setServiceId((current) =>
        nextServices.some((item) => item.id === current)
          ? current
          : (nextServices[0]?.id ?? "")
      )
      setProfileReady(true)
    }

    // Data contoh: selalu isi paket contoh + harga supaya form bisa dicoba.
    if (isDemo) {
      const published = publishFromOwner(user, { demo: true })
      applyServices(
        published.name,
        published.phone,
        published.services.length
          ? published.services
          : toPublicServices(DEMO_BOOKING_SERVICES)
      )
      return
    }

    // Mode nyata: snapshot layanan owner ke profil publik.
    if (user?.services?.length) {
      publishFromOwner(user)
    }

    const published = readPublicBookingProfile(slug)
    if (published?.services.length) {
      applyServices(
        published.name || studio.name,
        published.phone || studio.phone,
        published.services
      )
      return
    }

    if (user?.services?.length && slug === studio.slug) {
      applyServices(
        user.studioName?.trim() || user.name?.trim() || studio.name,
        user.phone?.trim() || studio.phone,
        toPublicServices(user.services)
      )
      return
    }

    applyServices(
      user?.studioName?.trim() || user?.name?.trim() || studio.name,
      user?.phone?.trim() || studio.phone,
      []
    )
  }, [authReady, isDemo, ready, slug, user])

  const selected = services.find((item) => item.id === serviceId) ?? services[0]

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
      eventType: eventTypeForField(selected.fieldId),
      date,
      time,
      location: "Lokasi menyusul (dikunci owner)",
      packageId: selected.id,
      packageName: selected.name,
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
            href={waLink(studioPhone, `Halo ${studioName}, saya ingin tanya jadwal.`)}
            className="ml-auto text-sm font-medium text-primary"
          >
            Chat WA
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-lg gap-5 px-4 py-7">
        <div>
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            Ajukan booking
          </p>
          <h1 className="mt-2 text-4xl">{studioName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Isi beberapa langkah berikut. Setelah kamu mengirim booking, kami akan mengonfirmasi
            melalui WhatsApp.
          </p>
        </div>

        {submitted && selected ? (
          <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="font-display text-2xl">Booking berhasil diajukan 🎉</p>
            <p className="text-sm text-muted-foreground">
              Permintaan booking kamu sudah diterima. {studioName} akan menghubungimu melalui
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
                studioPhone,
                `Halo ${studioName}, saya baru mengajukan booking ${selected.name} untuk ${formatDate(date)} jam ${formatTime(time)}.`
              )}
              className={cn(buttonVariants(), "h-11")}
            >
              Chat WhatsApp {studioName}
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
                  {!profileReady ? (
                    <p className="text-sm text-muted-foreground">Memuat layanan…</p>
                  ) : services.length === 0 ? (
                    <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                      Belum ada layanan yang disiapkan owner. Hubungi {studioName} lewat WhatsApp,
                      atau minta owner menambah layanan di menu Layanan.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {services.map((item) => {
                        const active = item.id === selected?.id
                        const blurb = serviceBlurb(item)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setServiceId(item.id)}
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
                                {blurb ? (
                                  <p className="mt-0.5 text-sm text-muted-foreground">{blurb}</p>
                                ) : null}
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
                  )}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-3">
                  <div>
                    <h2 className="font-display text-2xl">2. Pilih tanggal & waktu</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pilih tanggal dan waktu yang kamu inginkan.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Jadwal akan dikonfirmasi oleh {studioName} setelah booking dikirim.
                    </p>
                  </div>
                  <ScheduleFields
                    date={date}
                    time={time}
                    onDateChange={setDate}
                    onTimeChange={setTime}
                    dateId="booking-date"
                    timeId="booking-time"
                    inputClassName="h-11 bg-background"
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3">
                  <div>
                    <h2 className="font-display text-2xl">3. Data Diri</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Masukkan nama dan nomor WhatsApp agar kami bisa menghubungimu untuk
                      konfirmasi booking.
                    </p>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking-name">Nama lengkap</Label>
                    <Input
                      id="booking-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking-wa">Nomor WhatsApp</Label>
                    <Input
                      id="booking-wa"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="08xxxxxxxxxx"
                      inputMode="tel"
                      className="h-11 bg-background"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    Pastikan nomor WhatsApp yang kamu masukkan masih aktif.
                  </p>
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
                      <dd className="text-right font-medium">{selected?.name ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Harga</dt>
                      <dd className="font-medium">
                        {selected ? rupiah(selected.price) : "—"}
                      </dd>
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
                  <Button
                    type="button"
                    className="h-11 flex-1"
                    disabled={step === 1 && !selected}
                    onClick={goNext}
                  >
                    Lanjut
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 flex-1"
                    disabled={!ready || !selected}
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
