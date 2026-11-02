"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { useAdminSettings } from "@/components/admin-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_ADMIN_SETTINGS,
  type AdminSettings,
} from "@/lib/admin-settings"
import { formatPlanPrice } from "@/lib/trial"
import { cn } from "@/lib/utils"

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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-3 rounded-xl bg-background p-3 ring-1 ring-foreground/10">
            <p className="text-sm font-medium">Bulanan</p>
            <div className="grid gap-1.5">
              <Label htmlFor="compare-monthly">Harga awal / coret (Rp)</Label>
              <Input
                id="compare-monthly"
                className="h-10"
                inputMode="numeric"
                placeholder="49000"
                value={moneyInput(draft.plan.compareAtMonthly)}
                onChange={(event) =>
                  patchPlan({ compareAtMonthly: parseMoney(event.target.value) })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price-monthly">Harga jual (Rp)</Label>
              <Input
                id="price-monthly"
                className="h-10"
                inputMode="numeric"
                placeholder="20000"
                value={moneyInput(draft.plan.priceMonthly)}
                onChange={(event) =>
                  patchPlan({ priceMonthly: parseMoney(event.target.value) })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tampil:{" "}
              {draft.plan.compareAtMonthly ? (
                <span className="line-through">
                  {formatPlanPrice(draft.plan.compareAtMonthly)}
                </span>
              ) : null}{" "}
              {formatPlanPrice(draft.plan.priceMonthly)}
            </p>
          </div>
          <div className="grid gap-3 rounded-xl bg-background p-3 ring-1 ring-foreground/10">
            <p className="text-sm font-medium">Tahunan</p>
            <div className="grid gap-1.5">
              <Label htmlFor="compare-yearly">Harga awal / coret (Rp)</Label>
              <Input
                id="compare-yearly"
                className="h-10"
                inputMode="numeric"
                placeholder="539000"
                value={moneyInput(draft.plan.compareAtYearly)}
                onChange={(event) =>
                  patchPlan({ compareAtYearly: parseMoney(event.target.value) })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price-yearly">Harga jual (Rp)</Label>
              <Input
                id="price-yearly"
                className="h-10"
                inputMode="numeric"
                placeholder="220000"
                value={moneyInput(draft.plan.priceYearly)}
                onChange={(event) =>
                  patchPlan({ priceYearly: parseMoney(event.target.value) })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tampil:{" "}
              {draft.plan.compareAtYearly ? (
                <span className="line-through">
                  {formatPlanPrice(draft.plan.compareAtYearly)}
                </span>
              ) : null}{" "}
              {formatPlanPrice(draft.plan.priceYearly)}
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
          <h2 className="text-2xl">Metode bayar & QRIS</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detail QRIS merchant, transfer, VA, e-wallet, dan kontak support
            diatur di halaman khusus agar lebih lengkap.
          </p>
        </div>
        <Link
          href="/admin/metode-bayar"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 w-fit")}
        >
          Buka Metode Bayar
        </Link>
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
