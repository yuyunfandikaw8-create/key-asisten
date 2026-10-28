"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BusinessService } from "@/lib/onboarding"
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

  const [services, setServices] = useState<BusinessService[]>([])
  const [draftName, setDraftName] = useState("")
  const [draftDetails, setDraftDetails] = useState("")
  const [draftPrice, setDraftPrice] = useState("")
  const [draftDuration, setDraftDuration] = useState("")

  useEffect(() => {
    if (!user) return
    setServices(user.services || [])
  }, [user])

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

  function hasPackageName(name: string, exceptId?: string) {
    const needle = name.trim().toLowerCase()
    return services.some(
      (service) =>
        service.id !== exceptId && service.name.trim().toLowerCase() === needle
    )
  }

  function addService() {
    if (!draftName.trim()) {
      setError("Isi nama paket.")
      return
    }
    if (hasPackageName(draftName)) {
      setError("Paket dengan nama itu sudah ada.")
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
        // fieldId tetap ada untuk kompatibilitas data lama; paket tidak lagi dikunci ke 1 bidang.
        fieldId: "other",
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
      fieldId: service.fieldId || "other",
      name: service.name.trim(),
      details: service.details?.trim() || "",
    }))
    const updated = await updateProfile({
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
      <div className="grid gap-3 rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/10">
        <div>
          <p className="font-medium">Tambah paket</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Isi nama paket, rincian, harga, dan waktu. Satu paket bisa mencakup beberapa
            layanan — tidak perlu pilih bidang.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="paket-nama">Nama paket</Label>
          <Input
            id="paket-nama"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Contoh: Paket Emas / Wedding Complete"
            className="h-11 bg-background"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="paket-rincian">Rincian paket</Label>
          <Textarea
            id="paket-rincian"
            value={draftDetails}
            onChange={(event) => setDraftDetails(event.target.value)}
            placeholder="Contoh: Makeup + hijab + attire pengantin, termasuk keluarga inti."
            className="min-h-20 bg-background"
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
            />
          </div>
        </div>

        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          onClick={addService}
        >
          <Plus className="size-4" />
          Tambah paket ke daftar
        </button>
      </div>

      <div className="grid gap-2">
        <div>
          <p className="font-medium">Daftar paket</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit nama, rincian, harga, dan waktu sebelum menyimpan. Paket ini muncul di
            link booking klien.
          </p>
        </div>
        {services.length ? (
          <div className="grid gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="grid gap-3 rounded-xl bg-background p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">Paket</p>
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
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Belum ada paket. Isi form di atas untuk menambah paket pertama.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-primary">Paket layanan tersimpan.</p>
      ) : null}

      <button
        type="button"
        className={cn(buttonVariants(), "h-11")}
        disabled={pending}
        onClick={() => void save()}
      >
        {pending ? "Menyimpan…" : "Simpan paket"}
      </button>
    </section>
  )
}
