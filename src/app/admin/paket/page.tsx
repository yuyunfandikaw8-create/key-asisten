"use client"

import { useEffect, useState } from "react"

import { useAdminSettings } from "@/components/admin-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_ADMIN_SETTINGS,
  type AdminPayMethod,
  type AdminSettings,
} from "@/lib/admin-settings"
import { formatPlanPrice } from "@/lib/trial"
import { cn } from "@/lib/utils"

const PAY_OPTIONS: { id: AdminPayMethod; label: string }[] = [
  { id: "qris", label: "QRIS" },
  { id: "va", label: "Virtual Account" },
  { id: "ewallet", label: "E-Wallet" },
  { id: "transfer", label: "Transfer manual" },
]

function moneyInput(value: number | null) {
  return value == null ? "" : String(value)
}

function parseMoney(raw: string): number | null {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function AdminPaketPage() {
  const { ready, settings, saveSettings, resetSettings } = useAdminSettings()
  const [draft, setDraft] = useState<AdminSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  if (!ready) return <StudioLoading />

  function patchPlan(patch: Partial<AdminSettings["plan"]>) {
    setDraft((current) => ({
      ...current,
      plan: { ...current.plan, ...patch },
    }))
    setSaved(false)
  }

  function toggleMethod(id: AdminPayMethod) {
    setDraft((current) => {
      const has = current.enabledPayMethods.includes(id)
      const enabledPayMethods = has
        ? current.enabledPayMethods.filter((item) => item !== id)
        : [...current.enabledPayMethods, id]
      return { ...current, enabledPayMethods }
    })
    setSaved(false)
  }

  function save() {
    setError("")
    if (!draft.plan.name.trim()) {
      setError("Nama paket wajib diisi.")
      return
    }
    if (draft.plan.trialDays < 1) {
      setError("Durasi trial minimal 1 hari.")
      return
    }
    if (!draft.enabledPayMethods.length) {
      setError("Pilih minimal satu metode pembayaran.")
      return
    }
    saveSettings(draft)
    setSaved(true)
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Paket & Harga</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Semua angka di sini langsung dipakai halaman Paket & Langganan Owner.
          Kosongkan harga jika belum final.
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="grid gap-1.5">
          <Label htmlFor="plan-name">Nama paket</Label>
          <Input
            id="plan-name"
            className="h-10"
            value={draft.plan.name}
            onChange={(event) => patchPlan({ name: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="price-monthly">Harga bulanan (Rp)</Label>
            <Input
              id="price-monthly"
              className="h-10"
              inputMode="numeric"
              placeholder="Contoh: 149000 — kosong = belum ditetapkan"
              value={moneyInput(draft.plan.priceMonthly)}
              onChange={(event) =>
                patchPlan({ priceMonthly: parseMoney(event.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Tampil: {formatPlanPrice(draft.plan.priceMonthly)}
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price-yearly">Harga tahunan (Rp)</Label>
            <Input
              id="price-yearly"
              className="h-10"
              inputMode="numeric"
              placeholder="Contoh: 1490000 — kosong = belum ditetapkan"
              value={moneyInput(draft.plan.priceYearly)}
              onChange={(event) =>
                patchPlan({ priceYearly: parseMoney(event.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Tampil: {formatPlanPrice(draft.plan.priceYearly)}
            </p>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="trial-days">Durasi trial (hari)</Label>
          <Input
            id="trial-days"
            className="h-10"
            type="number"
            min={1}
            max={90}
            value={draft.plan.trialDays}
            onChange={(event) =>
              patchPlan({
                trialDays: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="blurb-monthly">Deskripsi bulanan</Label>
          <Textarea
            id="blurb-monthly"
            value={draft.plan.blurbMonthly}
            onChange={(event) => patchPlan({ blurbMonthly: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="blurb-yearly">Deskripsi tahunan</Label>
          <Textarea
            id="blurb-yearly"
            value={draft.plan.blurbYearly}
            onChange={(event) => patchPlan({ blurbYearly: event.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={draft.plan.isActive}
            onChange={(event) => patchPlan({ isActive: event.target.checked })}
          />
          Paket aktif (bisa dipilih Owner)
        </label>
      </section>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Metode pembayaran langganan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hanya metode yang dicentang yang muncul di /langganan.
          </p>
        </div>
        <div className="grid gap-2">
          {PAY_OPTIONS.map((method) => (
            <label
              key={method.id}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm ring-1 ring-foreground/10"
            >
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={draft.enabledPayMethods.includes(method.id)}
                onChange={() => toggleMethod(method.id)}
              />
              {method.label}
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Pengumuman di /langganan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Opsional — tampil di halaman Owner.
          </p>
        </div>
        <Textarea
          value={draft.serverNotice}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              serverNotice: event.target.value,
            }))
            setSaved(false)
          }}
          placeholder="Contoh: Harga promo berlaku sampai akhir bulan."
        />
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-primary">Perubahan disimpan ke menu server.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(buttonVariants(), "h-11")}
          onClick={save}
        >
          Simpan pengaturan
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          onClick={() => {
            const next = resetSettings()
            setDraft(next)
            setSaved(true)
            setError("")
          }}
        >
          Reset ke default
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost" }), "h-11")}
          onClick={() => {
            setDraft(DEFAULT_ADMIN_SETTINGS)
            setSaved(false)
          }}
        >
          Muat template kosong harga
        </button>
      </div>
    </div>
  )
}
