"use client"

import Link from "next/link"
import { useMemo } from "react"

import { useAdminSettings } from "@/components/admin-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  listPendingSubscriptionPayments,
  readAllLocalAccounts,
} from "@/lib/admin-accounts"
import { formatDateId, formatPlanPrice, isPricingPublished } from "@/lib/trial"
import { cn } from "@/lib/utils"

export default function AdminHomePage() {
  const { ready, settings } = useAdminSettings()
  const accounts = useMemo(() => readAllLocalAccounts(), [ready, settings])
  const pending = useMemo(
    () => listPendingSubscriptionPayments(),
    [ready, settings, accounts]
  )

  if (!ready) return <StudioLoading />

  const owners = accounts.filter((item) => item.role === "owner")
  const clients = accounts.filter((item) => item.role === "client")
  const pricingReady = isPricingPublished()
  const qris = settings.paymentDetails.qris
  const methods = settings.enabledPayMethods

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Menu Server</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pusat kontrol Key Assistant: paket, harga, QRIS/metode bayar,
          verifikasi pembayaran Owner, dan daftar akun.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Owner
          </p>
          <p className="mt-1 font-display text-3xl">{owners.length}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Klien
          </p>
          <p className="mt-1 font-display text-3xl">{clients.length}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Bayar pending
          </p>
          <p className="mt-1 font-display text-3xl">{pending.length}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Trial
          </p>
          <p className="mt-1 font-display text-3xl">
            {settings.plan.trialDays}
            <span className="text-base font-sans font-normal text-muted-foreground">
              {" "}
              hari
            </span>
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Paket langganan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {settings.plan.name}
            {settings.updatedAt
              ? ` · Diperbarui ${formatDateId(settings.updatedAt)}`
              : ""}
          </p>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-foreground/10">
            <dt className="text-muted-foreground">Harga bulanan</dt>
            <dd className="font-medium">
              {formatPlanPrice(settings.plan.priceMonthly)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-foreground/10">
            <dt className="text-muted-foreground">Harga tahunan</dt>
            <dd className="font-medium">
              {formatPlanPrice(settings.plan.priceYearly)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-foreground/10">
            <dt className="text-muted-foreground">Status harga</dt>
            <dd className="font-medium">
              {pricingReady ? "Sudah dipublikasikan" : "Belum ditetapkan"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-xl bg-background px-3 py-2 ring-1 ring-foreground/10">
            <dt className="text-muted-foreground">Paket aktif</dt>
            <dd className="font-medium">
              {settings.plan.isActive ? "Ya" : "Tidak"}
            </dd>
          </div>
        </dl>
        <Link href="/admin/paket" className={cn(buttonVariants(), "h-10 w-fit")}>
          Atur paket & harga
        </Link>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl">QRIS & metode bayar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Merchant {qris.merchantName} · NMID {qris.nmid} · Terminal{" "}
              {qris.terminalId}
            </p>
          </div>
          <Link
            href="/admin/metode-bayar"
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
          >
            Kelola metode bayar
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qris.imageUrl}
              alt="QRIS KEY ASSISTANT"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Metode aktif: </span>
              <span className="font-medium">
                {methods.length ? methods.join(", ").toUpperCase() : "—"}
              </span>
            </p>
            <p className="text-muted-foreground whitespace-pre-line">
              {qris.instructions.split("\n").slice(0, 3).join("\n")}
            </p>
            {settings.supportWhatsapp || settings.supportEmail ? (
              <p className="text-muted-foreground">
                Support:{" "}
                {[settings.supportWhatsapp, settings.supportEmail]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Belum ada kontak support — isi di Metode Bayar.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl">Verifikasi pembayaran</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pending.length
                ? `${pending.length} pembayaran menunggu konfirmasi.`
                : "Tidak ada pembayaran pending saat ini."}
            </p>
          </div>
          <Link
            href="/admin/pembayaran"
            className={cn(buttonVariants(), "h-10")}
          >
            Buka verifikasi
          </Link>
        </div>
        {pending.slice(0, 3).map((row) => (
          <div
            key={`${row.accountEmail}-${row.payment.id}`}
            className="rounded-xl bg-background px-3 py-3 text-sm ring-1 ring-foreground/10"
          >
            <p className="font-medium">
              {row.accountName} · {formatPlanPrice(row.payment.amount)}
            </p>
            <p className="text-muted-foreground">
              {row.accountEmail} · {row.payment.invoiceNumber} ·{" "}
              {row.payment.paymentMethod.toUpperCase()}
            </p>
          </div>
        ))}
      </section>

      {settings.adminNotes ? (
        <section className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Catatan admin</p>
          <p className="mt-1 whitespace-pre-line">{settings.adminNotes}</p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/akun"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          Kelola akun
        </Link>
        <Link
          href="/langganan"
          className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
        >
          Lihat halaman Owner /langganan
        </Link>
      </div>
    </div>
  )
}
