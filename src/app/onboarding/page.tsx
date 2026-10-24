"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { CitySearchPicker } from "@/components/city-search-picker"
import { StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BUSINESS_FIELDS,
  fieldById,
  filterServicePresets,
  formatFieldsSummary,
  markOnboardingDone,
  needsOnboarding,
  presetsForField,
  type BusinessFieldId,
  type BusinessService,
  type OnboardingStep,
  type ServicePreset,
} from "@/lib/onboarding"
import { cn } from "@/lib/utils"

function stepNumber(step: OnboardingStep | undefined): number {
  return typeof step === "number" ? step : 2
}

export default function OnboardingPage() {
  const router = useRouter()
  const { ready, user, updateProfile, syncNotice, dismissSyncNotice } = useAuth()
  const { setCity } = useStudio()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const [studioName, setStudioName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCityField] = useState("")
  const [fields, setFields] = useState<BusinessFieldId[]>([])
  const [businessEmail, setBusinessEmail] = useState("")
  const [instagram, setInstagram] = useState("")
  const [address, setAddress] = useState("")
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>()
  const [services, setServices] = useState<BusinessService[]>([])
  const [draftName, setDraftName] = useState("")
  const [draftField, setDraftField] = useState<BusinessFieldId | "">("")
  const [showCustomForm, setShowCustomForm] = useState(false)

  useEffect(() => {
    if (!user) return
    setStudioName(user.studioName || "")
    setOwnerName(user.name || "")
    setPhone(user.phone || "")
    setCityField(user.city || "")
    setFields(user.businessFields || [])
    setBusinessEmail(user.businessEmail || user.email || "")
    setInstagram(user.instagram || "")
    setAddress(user.address || "")
    setLogoDataUrl(user.logoDataUrl)
    setServices(user.services || [])
    setDraftField(user.businessFields?.[0] ?? "")
  }, [user])

  useEffect(() => {
    if (ready && user && !needsOnboarding(user)) {
      router.replace("/studio")
    }
  }, [ready, router, user])

  const step = stepNumber(user?.onboardingStep)
  const selectedFields = useMemo(
    () => BUSINESS_FIELDS.filter((field) => fields.includes(field.id)),
    [fields]
  )
  const filteredPresets = useMemo(() => {
    if (!draftField) return []
    return filterServicePresets(draftField, draftName)
  }, [draftField, draftName])
  const exactPresetMatch = useMemo(() => {
    if (!draftField || !draftName.trim()) return false
    return presetsForField(draftField).some(
      (preset) => preset.name.toLowerCase() === draftName.trim().toLowerCase()
    )
  }, [draftField, draftName])

  if (!ready || !user) return <StudioLoading />
  if (!needsOnboarding(user)) return <StudioLoading />

  async function goTo(next: OnboardingStep, patch: Parameters<typeof updateProfile>[0] = {}) {
    setPending(true)
    setError("")
    const updated = await updateProfile({ ...patch, onboardingStep: next })
    setPending(false)
    if (!updated) {
      setError("Gagal menyimpan. Coba lagi.")
      return false
    }
    return true
  }

  async function goBack() {
    setError("")
    if (step <= 2) {
      // Step sebelumnya adalah buat akun di /daftar
      router.push("/daftar")
      return
    }
    const previous = (step - 1) as 2 | 3 | 4 | 5
    await goTo(previous)
  }

  function toggleField(id: BusinessFieldId) {
    setFields((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  async function onLogoChange(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Unggah file gambar untuk logo.")
      return
    }
    if (file.size > 1_500_000) {
      setError("Logo maksimal sekitar 1,5 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoDataUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function hasService(fieldId: BusinessFieldId, name: string) {
    const needle = name.trim().toLowerCase()
    return services.some(
      (service) =>
        service.fieldId === fieldId && service.name.trim().toLowerCase() === needle
    )
  }

  function togglePreset(fieldId: BusinessFieldId, preset: ServicePreset) {
    setError("")
    setServices((current) => {
      const existing = current.find(
        (service) =>
          service.fieldId === fieldId &&
          service.name.trim().toLowerCase() === preset.name.toLowerCase()
      )
      if (existing) {
        return current.filter((service) => service.id !== existing.id)
      }
      return [
        ...current,
        {
          id: crypto.randomUUID(),
          fieldId,
          name: preset.name,
          price: 0,
          durationHours: 0,
        },
      ]
    })
  }

  function updateService(
    id: string,
    patch: Partial<Pick<BusinessService, "price" | "durationHours" | "name">>
  ) {
    setServices((current) =>
      current.map((service) => (service.id === id ? { ...service, ...patch } : service))
    )
  }

  function addService() {
    if (!draftField || !draftName.trim()) {
      setError("Pilih bidang dan isi nama layanan.")
      return
    }
    if (hasService(draftField, draftName)) {
      setError("Layanan ini sudah ditambahkan.")
      return
    }
    setError("")
    setServices((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        fieldId: draftField,
        name: draftName.trim(),
        price: 0,
        durationHours: 0,
      },
    ])
    setDraftName("")
  }

  async function finish() {
    setPending(true)
    setError("")
    // Flag kecil dulu — ini yang mencegah redirect balik ke /onboarding.
    markOnboardingDone(user?.email)
    try {
      if (city.trim()) setCity(city.trim())
      const updated = await updateProfile({ onboardingStep: "done" })
      if (!updated) {
        // Flag sudah terpasang; tetap coba masuk studio.
        window.location.href = "/studio"
        return
      }
      if (updated.city) setCity(updated.city)
      window.location.href = "/studio"
    } catch {
      // Meskipun update gagal, flag done sudah ada — masuk studio.
      window.location.href = "/studio"
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-center gap-6 px-4 py-10">
      {syncNotice ? (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
          <p>{syncNotice}</p>
          <button
            type="button"
            className="shrink-0 font-medium"
            onClick={dismissSyncNotice}
          >
            Tutup
          </button>
        </div>
      ) : null}
      <div>
        <p className="font-display text-2xl">Key Assistant</p>
        <p className="mt-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Step {step} dari 6
        </p>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "-ml-2 mt-3 h-9 gap-1.5 px-2 text-muted-foreground"
          )}
          disabled={pending}
          onClick={() => void goBack()}
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>
      </div>

      {step === 2 ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h1 className="text-3xl">Sekarang, buat ruang kerja bisnis kamu</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Data bisnis kamu akan tersimpan secara aman di ruang kerja ini. Pembuat
              workspace otomatis menjadi Owner.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="studio">Nama bisnis</Label>
            <Input
              id="studio"
              value={studioName}
              onChange={(event) => setStudioName(event.target.value)}
              placeholder="Contoh: Nadila Wedding"
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="owner">Nama pemilik</Label>
            <Input
              id="owner"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              placeholder="Nadila Putri"
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Nomor WhatsApp</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">Kota / Wilayah</Label>
            <CitySearchPicker
              id="city"
              value={city}
              onChange={setCityField}
              placeholder="Surabaya"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            className={cn(buttonVariants(), "h-11")}
            disabled={pending}
            onClick={() => {
              if (!studioName.trim() || !ownerName.trim() || !phone.trim() || !city.trim()) {
                setError("Lengkapi nama bisnis, pemilik, WhatsApp, dan kota.")
                return
              }
              void goTo(3, {
                studioName: studioName.trim(),
                name: ownerName.trim(),
                phone: phone.trim(),
                city: city.trim(),
              })
            }}
          >
            {pending ? "Menyimpan…" : "Lanjutkan"}
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h1 className="text-3xl">Apa saja layanan yang kamu sediakan?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pilih semua yang sesuai. Kamu bisa menambahkan layanan lainnya kapan saja.
            </p>
          </div>
          <div className="grid gap-2">
            {BUSINESS_FIELDS.map((field) => {
              const checked = fields.includes(field.id)
              return (
                <label
                  key={field.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ring-1 transition",
                    checked
                      ? "bg-primary/8 ring-primary"
                      : "bg-background ring-foreground/10 hover:bg-muted/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleField(field.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-lg" aria-hidden>
                    {field.emoji}
                  </span>
                  <span className="text-sm font-medium">{field.label}</span>
                </label>
              )
            })}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            className={cn(buttonVariants(), "h-11")}
            disabled={pending}
            onClick={() => {
              if (!fields.length) {
                setError("Pilih minimal satu bidang bisnis.")
                return
              }
              void goTo(4, { businessFields: fields })
            }}
          >
            {pending ? "Menyimpan…" : "Lanjutkan"}
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h1 className="text-3xl">Lengkapi profil bisnis</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Detail ini muncul di pricelist dan komunikasi dengan klien.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Logo bisnis</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-foreground/20 px-4 py-4 transition hover:bg-muted/40">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoDataUrl}
                  alt="Logo bisnis"
                  className="size-14 rounded-xl object-cover"
                />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-xl bg-muted">
                  <ImagePlus className="size-5 text-muted-foreground" />
                </span>
              )}
              <span className="text-sm font-medium">+ Tambahkan logo</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void onLogoChange(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="studio-4">Nama bisnis</Label>
            <Input
              id="studio-4"
              value={studioName}
              onChange={(event) => setStudioName(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="owner-4">Nama pemilik</Label>
            <Input
              id="owner-4"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone-4">WhatsApp bisnis</Label>
            <Input
              id="phone-4"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email-4">Email bisnis</Label>
            <Input
              id="email-4"
              type="email"
              value={businessEmail}
              onChange={(event) => setBusinessEmail(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city-4">Kota / Wilayah</Label>
            <CitySearchPicker
              id="city-4"
              value={city}
              onChange={setCityField}
              placeholder="Cari kota"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ig">Instagram</Label>
            <Input
              id="ig"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="@nadilawedding"
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Opsional"
              className="min-h-20"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            className={cn(buttonVariants(), "h-11")}
            disabled={pending}
            onClick={() => {
              if (!studioName.trim() || !ownerName.trim() || !phone.trim() || !city.trim()) {
                setError("Nama bisnis, pemilik, WhatsApp, dan kota wajib diisi.")
                return
              }
              void goTo(5, {
                studioName: studioName.trim(),
                name: ownerName.trim(),
                phone: phone.trim(),
                city: city.trim(),
                businessEmail: businessEmail.trim() || user.email,
                instagram: instagram.trim(),
                address: address.trim(),
                logoDataUrl,
              })
            }}
          >
            {pending ? "Menyimpan…" : "Simpan & Lanjutkan"}
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h1 className="text-3xl">Atur layanan bisnis kamu</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pilih nama layanan, lalu isi harga dan waktu di tabel di bawah. Langkah
              ini boleh dilewati.
            </p>
          </div>

          {selectedFields.map((field) => {
            const presets = presetsForField(field.id)
            return (
              <div key={field.id} className="grid gap-3">
                <p className="font-medium">
                  {field.emoji} {field.label}
                </p>
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl bg-background p-2 ring-1 ring-foreground/10">
                  {presets.map((preset) => {
                    const checked = hasService(field.id, preset.name)
                    return (
                      <label
                        key={preset.name}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition",
                          checked ? "bg-primary/8 font-medium" : "hover:bg-muted/60"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePreset(field.id, preset)}
                          className="size-4 accent-primary"
                        />
                        <span>{preset.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="grid gap-2 rounded-xl bg-muted/40 p-3">
            <button
              type="button"
              className="flex items-center justify-between text-left text-sm font-medium"
              onClick={() => setShowCustomForm((open) => !open)}
            >
              <span>Tidak ada di daftar? Tulis layanan sendiri</span>
              <Plus
                className={cn(
                  "size-4 transition",
                  showCustomForm ? "rotate-45" : "rotate-0"
                )}
              />
            </button>
            {showCustomForm ? (
              <>
                <select
                  value={draftField}
                  onChange={(event) => {
                    setDraftField(event.target.value as BusinessFieldId)
                    setDraftName("")
                  }}
                  className="h-10 rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="">Pilih bidang</option>
                  {selectedFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.emoji} {field.label}
                    </option>
                  ))}
                </select>
                <div className="grid gap-1.5">
                  <Input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Cari atau ketik nama layanan"
                    className="h-10 bg-background"
                    disabled={!draftField}
                  />
                  {draftField && draftName.trim() ? (
                    <div className="max-h-36 overflow-y-auto rounded-lg border bg-background">
                      {filteredPresets.slice(0, 8).map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/70"
                          onClick={() => setDraftName(preset.name)}
                        >
                          {preset.name}
                        </button>
                      ))}
                      {!exactPresetMatch ? (
                        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                          Pakai nama kustom: “{draftName.trim()}”
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline" }), "h-10")}
                  onClick={addService}
                >
                  <Plus className="size-4" />
                  Tambahkan ke tabel
                </button>
              </>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div>
              <p className="font-medium">Harga & waktu layanan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Isi harga (Rp) dan waktu/durasi (jam) secara manual untuk setiap layanan
                yang dipilih.
              </p>
            </div>
            {services.length ? (
              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Layanan</th>
                      <th className="w-32 px-3 py-2.5 font-medium">Harga (Rp)</th>
                      <th className="w-28 px-3 py-2.5 font-medium">Waktu (jam)</th>
                      <th className="w-12 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => {
                      const field = fieldById(service.fieldId)
                      return (
                        <tr
                          key={service.id}
                          className="border-t border-foreground/10 bg-background"
                        >
                          <td className="px-3 py-2 align-top">
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {field ? `${field.emoji} ${field.short}` : service.fieldId}
                            </p>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Input
                              value={service.price ? String(service.price) : ""}
                              onChange={(event) =>
                                updateService(service.id, {
                                  price: Number(event.target.value.replace(/\D/g, "")) || 0,
                                })
                              }
                              inputMode="numeric"
                              placeholder="0"
                              className="h-9 bg-background"
                              aria-label={`Harga ${service.name}`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Input
                              value={
                                service.durationHours ? String(service.durationHours) : ""
                              }
                              onChange={(event) =>
                                updateService(service.id, {
                                  durationHours:
                                    Number(event.target.value.replace(",", ".")) || 0,
                                })
                              }
                              inputMode="decimal"
                              placeholder="0"
                              className="h-9 bg-background"
                              aria-label={`Waktu ${service.name}`}
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setServices((current) =>
                                  current.filter((item) => item.id !== service.id)
                                )
                              }
                              aria-label={`Hapus ${service.name}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                Belum ada layanan dipilih. Centang dari daftar di atas, lalu isi harga dan
                waktu di sini.
              </p>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="grid gap-2">
            <button
              type="button"
              className={cn(buttonVariants(), "h-11")}
              disabled={pending}
              onClick={() => {
                if (services.some((service) => !service.price)) {
                  setError("Isi harga untuk semua layanan di tabel, atau hapus yang kosong.")
                  return
                }
                void goTo(6, { services })
              }}
            >
              {pending ? "Menyimpan…" : "Lanjutkan"}
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
              disabled={pending}
              onClick={() => void goTo(6, { services })}
            >
              Lewati untuk Sekarang
            </button>
          </div>
        </section>
      ) : null}

      {step === 6 ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <p className="text-sm text-muted-foreground">Bisnis kamu siap!</p>
            <h1 className="mt-1 text-3xl">
              Selamat datang di {user.studioName || "bisnis kamu"}
            </h1>
          </div>
          <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Layanan kamu
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {formatFieldsSummary(user.businessFields)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Trial gratis 14 hari. Kamu bisa mulai mengelola bisnis sekarang.
          </p>
          {user.businessFields?.map((id) => {
            const field = fieldById(id)
            const count = (user.services || []).filter((item) => item.fieldId === id).length
            if (!field || !count) return null
            return (
              <p key={id} className="text-sm text-muted-foreground">
                {field.emoji} {field.label}: {count} layanan
              </p>
            )
          })}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            className={cn(buttonVariants(), "h-11")}
            disabled={pending}
            onClick={() => void finish()}
          >
            {pending ? "Menyimpan…" : "Simpan & masuk ke Dashboard"}
          </button>
        </section>
      ) : null}
    </div>
  )
}
