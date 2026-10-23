"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BUSINESS_FIELDS,
  fieldById,
  filterServicePresets,
  presetsForField,
  type BusinessFieldId,
  type BusinessService,
  type ServicePreset,
} from "@/lib/onboarding"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  onSaved?: () => void
}

export function BusinessServicesEditor({ className, onSaved }: Props) {
  const { user, updateProfile } = useAuth()
  const { showReal, viewMode } = useStudio()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const [fields, setFields] = useState<BusinessFieldId[]>([])
  const [services, setServices] = useState<BusinessService[]>([])
  const [draftName, setDraftName] = useState("")
  const [draftField, setDraftField] = useState<BusinessFieldId | "">("")
  const [showCustomForm, setShowCustomForm] = useState(false)

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
      // Drop services for unchecked fields so catalog stays consistent.
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
        },
      ]
    })
  }

  function updateService(
    id: string,
    patch: Partial<Pick<BusinessService, "price" | "durationHours" | "name">>
  ) {
    setSaved(false)
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
    setSaved(false)
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

  async function save() {
    if (!user) return
    if (!fields.length) {
      setError("Pilih minimal satu bidang bisnis.")
      setSaved(false)
      return
    }
    if (services.some((service) => !service.price)) {
      setError("Isi harga untuk semua layanan di tabel, atau hapus yang kosong.")
      setSaved(false)
      return
    }
    setPending(true)
    setError("")
    setSaved(false)
    if (viewMode === "demo") showReal()
    const updated = await updateProfile({
      businessFields: fields,
      services,
    })
    setPending(false)
    if (!updated) {
      setError("Gagal menyimpan. Coba lagi.")
      return
    }
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

      <div className="grid gap-2 rounded-xl bg-muted/40 p-3">
        <button
          type="button"
          className="flex items-center justify-between text-left text-sm font-medium"
          onClick={() => setShowCustomForm((open) => !open)}
        >
          <span>Tidak ada di daftar? Tulis layanan sendiri</span>
          <Plus
            className={cn("size-4 transition", showCustomForm ? "rotate-45" : "rotate-0")}
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
            Isi harga (Rp) dan waktu/durasi (jam) untuk setiap layanan. Pilihan ini dipakai
            saat buat booking.
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Belum ada layanan. Centang dari daftar di atas, lalu isi harga dan waktu di
            sini.
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
