"use client"

import { useCallback, useEffect, useState } from "react"

import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  listPendingSubscriptionPayments,
  type PendingSubscriptionPayment,
  verifyAccountPayment,
} from "@/lib/admin-accounts"
import { formatDateId, formatPlanPrice } from "@/lib/trial"
import { cn } from "@/lib/utils"

export default function AdminPembayaranPage() {
  const [ready, setReady] = useState(false)
  const [rows, setRows] = useState<PendingSubscriptionPayment[]>([])
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [pendingId, setPendingId] = useState("")

  const refresh = useCallback(() => {
    setRows(listPendingSubscriptionPayments())
  }, [])

  useEffect(() => {
    refresh()
    setReady(true)
  }, [refresh])

  if (!ready) return <StudioLoading />

  async function verify(row: PendingSubscriptionPayment) {
    setPendingId(row.payment.id)
    setError("")
    setNotice("")
    const result = verifyAccountPayment({
      email: row.accountEmail,
      paymentId: row.payment.id,
    })
    setPendingId("")
    if (!result.ok) {
      setError(result.error)
      return
    }
    setNotice(
      `Pembayaran ${row.payment.invoiceNumber} untuk ${row.accountEmail} diverifikasi — status active.`
    )
    refresh()
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Pembayaran langganan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifikasi pembayaran Owner ke Key Assistant. Status active hanya
          setelah dikonfirmasi di sini.
        </p>
      </div>

      {notice ? (
        <p className="rounded-xl bg-primary/8 px-3 py-3 text-sm text-primary">
          {notice}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {rows.length === 0 ? (
        <section className="rounded-2xl bg-card p-5 text-sm text-muted-foreground ring-1 ring-foreground/10">
          Tidak ada pembayaran berstatus pending.
        </section>
      ) : (
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li
              key={`${row.accountEmail}-${row.payment.id}`}
              className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium">{row.accountName}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.accountEmail}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatPlanPrice(row.payment.amount)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {row.payment.invoiceNumber} ·{" "}
                {row.payment.period === "yearly" ? "Tahunan" : "Bulanan"} ·{" "}
                {row.payment.paymentMethod} · dibuat{" "}
                {formatDateId(row.payment.createdAt)}
              </p>
              <button
                type="button"
                className={cn(buttonVariants(), "h-10 w-fit")}
                disabled={pendingId === row.payment.id}
                onClick={() => void verify(row)}
              >
                {pendingId === row.payment.id
                  ? "Memverifikasi…"
                  : "Verifikasi & aktifkan"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
