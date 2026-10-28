"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BUSINESS_FIELDS,
  fieldById,
  filterServicePresets,
  presetsForField,
  type BusinessFieldId,
  type BusinessService,
  type ServicePreset,
} from "@/lib/onboarding"
import { publishFromOwner } from "@/lib/public-booking-profile"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  onSaved?: () => void
}

export function BusinessServicesEditor({ className, onSaved }: Props) {
  const { user, updateProfile } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const [fields, setFields] = useState<BusinessFieldId[]>([])
  const [services, setServices] = useState<BusinessService[]>([])
  const [draftName, setDraftName] = useState("")
  const [draftDetails, setDraftDetails] = useState("")
  const [draftPrice, setDraftPrice] = useState("")
  const [draftDuration, setDraftDuration] = useState("")
  const [draftField, setDraftField] = useState<BusinessFieldId | "">("")

  useEffect(() => {
    if (!user) return
    const nextFields = user.businessFields || []
    setFields(nextFields)
    setServices(user.services || [])
    setDraftField(nextFields[0] ?? "")
  }, [user])

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

  function toggleField(id: BusinessFieldId) {
    setSaved(false)
    setFields((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
      if (!next.includes(draftField as BusinessFieldId)) {
        setDraftField(next[0] ?? "")
      }
      if (current.includes(id) && !next.includes(id)) {
        setServices((list) => list.filter((service) => service.fieldId !== id))
      }
      return next
    })
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
    setSaved(false)
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
          details: "",
        },
      ]
    })
  }

  function updateService(
    id: string,
    patch: Partial<Pick<BusinessService, "price" | "durationHours" | "name" | "details">>
  ) {
    setSaved(false)
    setServices((current) =>
      current.map((service) => (service.id === id ? { ...service, ...patch } : service))
    )
  }

  function clearDraft() {
    setDraftName("")
    setDraftDetails("")
    setDraftPrice("")
    setDraftDuration("")
  }

  function addService() {
    if (!draftField || !draftName.trim()) {
      setError("Pilih bidang dan isi nama paket.")
      return
    }
    if (hasService(draftField, draftName)) {
      setError("Paket ini sudah ditambahkan.")
      return
    }
    const price = Number(draftPrice.replace(/\D/g, "")) || 0
    if (!price) {
      setError("Isi harga paket.")
      return
    }
    setError("")
    setSaved(false)
    setServices((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        fieldId: draftField,
        name: draftName.trim(),
        price,
        durationHours: Number(draftDuration.replace(",", ".")) || 0,
        details: draftDetails.trim(),
      },
    ])
    clearDraft()
  }

  async function save() {
    if (!user) return
    if (!fields.length) {
      setError("Pilih minimal satu bidang bisnis.")
      setSaved(false)
      return
    }
    if (!services.length) {
      setError("Tambah minimal satu paket layanan.")
      setSaved(false)
      return
    }
    if (services.some((service) => !service.name.trim() || !service.price)) {
      setError("Isi nama dan harga untuk semua paket, atau hapus yang kosong.")
      setSaved(false)
      return
    }
    setPending(true)
    setError("")
    setSaved(false)
    const cleaned = services.map((service) => ({
      ...service,
      name: service.name.trim(),
      details: service.details?.trim() || "",
    }))
    const updated = await updateProfile({
      businessFields: fields,
      services: cleaned,
    })
    setPending(false)
    if (!updated) {
      setError("Gagal menyimpan. Coba lagi.")
      return
    }
    publishFromOwner(updated)
    setSaved(true)
    onSaved?.()
  }

  if (!user) return null

  return (
    <section className={cn("grid gap-5", className)}>
      <div className="grid gap-2">
        <div>
          <p className="font-medium">Bidang layanan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Centang bidang yang kamu sediakan. Ini sama seperti saat daftar awal.
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

      <div className="grid gap-3 rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/10">
        <div>
          <p className="font-medium">Isi paket manual</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tulis nama paket, rincian, harga, dan waktu. Paket ini muncul di link booking
            klien.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="paket-bidang">Bidang</Label>
          <select
            id="paket-bidang"
            value={draftField}
            onChange={(event) => {
              setDraftField(event.target.value as BusinessFieldId)
              setDraftName("")
            }}
            className="h-11 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Pilih bidang</option>
            {selectedFields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.emoji} {field.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="paket-nama">Nama paket</Label>
          <Input
            id="paket-nama"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Contoh: Paket Emas / Wedding Makeup"
            className="h-11 bg-background"
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

        <div className="grid gap-1.5">
          <Label htmlFor="paket-rincian">Rincian paket</Label>
          <Textarea
            id="paket-rincian"
            value={draftDetails}
            onChange={(event) => setDraftDetails(event.target.value)}
            placeholder="Contoh: Rias pengantin akad dan resepsi, termasuk keluarga inti."
            className="min-h-20 bg-background"
            disabled={!draftField}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="paket-harga">Harga (Rp)</Label>
            <Input
              id="paket-harga"
              value={draftPrice}
              onChange={(event) =>
                setDraftPrice(event.target.value.replace(/\D/g, ""))
              }
              inputMode="numeric"
              placeholder="6500000"
              className="h-11 bg-background"
              disabled={!draftField}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="paket-waktu">Waktu / durasi (jam)</Label>
            <Input
              id="paket-waktu"
              value={draftDuration}
              onChange={(event) => setDraftDuration(event.target.value)}
              inputMode="decimal"
              placeholder="8"
              className="h-11 bg-background"
              disabled={!draftField}
            />
          </div>
        </div>

        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          onClick={addService}
          disabled={!selectedFields.length}
        >
          <Plus className="size-4" />
          Tambah paket ke daftar
        </button>
      </div>

      <div className="grid gap-2">
        <div>
          <p className="font-medium">Daftar paket</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit nama, rincian, harga, dan waktu sebelum menyimpan.
          </p>
        </div>
        {services.length ? (
          <div className="grid gap-3">
            {services.map((service) => {
              const field = fieldById(service.fieldId)
              return (
                <div
                  key={service.id}
                  className="grid gap-3 rounded-xl bg-background p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {field ? `${field.emoji} ${field.short}` : service.fieldId}
                    </p>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setSaved(false)
                        setServices((current) =>
                          current.filter((item) => item.id !== service.id)
                        )
                      }}
                      aria-label={`Hapus ${service.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor={`name-${service.id}`}>Nama paket</Label>
                    <Input
                      id={`name-${service.id}`}
                      value={service.name}
                      onChange={(event) =>
                        updateService(service.id, { name: event.target.value })
                      }
                      className="h-11 bg-background"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor={`details-${service.id}`}>Rincian</Label>
                    <Textarea
                      id={`details-${service.id}`}
                      value={service.details || ""}
                      onChange={(event) =>
                        updateService(service.id, { details: event.target.value })
                      }
                      placeholder="Detail isi paket…"
                      className="min-h-20 bg-background"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`price-${service.id}`}>Harga (Rp)</Label>
                      <Input
                        id={`price-${service.id}`}
                        value={service.price ? String(service.price) : ""}
                        onChange={(event) =>
                          updateService(service.id, {
                            price: Number(event.target.value.replace(/\D/g, "")) || 0,
                          })
                        }
                        inputMode="numeric"
                        placeholder="0"
                        className="h-11 bg-background"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`duration-${service.id}`}>Waktu (jam)</Label>
                      <Input
                        id={`duration-${service.id}`}
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
                        className="h-11 bg-background"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Belum ada paket. Centang dari daftar di atas, atau isi form paket manual.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-primary">Layanan bisnis tersimpan.</p>
      ) : null}

      <button
        type="button"
        className={cn(buttonVariants(), "h-11")}
        disabled={pending}
        onClick={() => void save()}
      >
        {pending ? "Menyimpan…" : "Simpan layanan"}
      </button>
    </section>
  )
}
