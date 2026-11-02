"use client"

import Link from "next/link"

import { useAdminSettings } from "@/components/admin-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  listPendingSubscriptionPayments,
  readAllLocalAccounts,
} from "@/lib/admin-accounts"
import { formatDateId, formatPlanPrice, isPricingPublished } from "@/lib/trial"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

export default function AdminHomePage() {
  const { ready, settings } = useAdminSettings()
  const accounts = useMemo(() => readAllLocalAccounts(), [ready, settings])
  const pending = useMemo(
    () => listPendingSubscriptionPayments(),
    [ready, settings, accounts]
  )

  if (!ready) return <StudioLoading />

  const owners = accounts.filter((item) => item.role === "owner").length
  const clients = accounts.filter((item) => item.role === "client").length
  const pricingReady = isPricingPublished()

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Menu Server</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atur paket langganan, harga, metode bayar, verifikasi pembayaran, dan
          akun dari satu tempat.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Owner
          </p>
          <p className="mt-1 font-display text-3xl">{owners}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Klien
          </p>
          <p className="mt-1 font-display text-3xl">{clients}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Bayar pending
          </p>
          <p className="mt-1 font-display text-3xl">{pending.length}</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Paket saat ini</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {settings.plan.name} · Trial {settings.plan.trialDays} hari
            {settings.updatedAt
              ? ` · Diperbarui ${formatDateId(settings.updatedAt)}`
              : ""}
          </p>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Harga bulanan</dt>
            <dd className="font-medium">
              {formatPlanPrice(settings.plan.priceMonthly)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Harga tahunan</dt>
            <dd className="font-medium">
              {formatPlanPrice(settings.plan.priceYearly)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Status harga</dt>
            <dd className="font-medium">
              {pricingReady ? "Sudah dipublikasikan" : "Belum ditetapkan"}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/paket" className={cn(buttonVariants(), "h-10")}>
            Atur paket & harga
          </Link>
          <Link
            href="/admin/pembayaran"
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          >
            Verifikasi pembayaran
          </Link>
          <Link
            href="/admin/akun"
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          >
            Kelola akun
          </Link>
        </div>
      </section>
    </div>
  )
}
