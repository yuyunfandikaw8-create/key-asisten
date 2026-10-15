"use client"

import { useState } from "react"

import { EmptyState, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMonth, formatShortDate, rupiah, todayISO } from "@/lib/format"
import { balance, financeSummary, isSameYear, monthKey, paymentStatus, recentMonths } from "@/lib/metrics"

export default function FinancePage() {
  const { ready, bookings, expenses, addExpense } = useStudio()
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")

  if (!ready) return <StudioLoading />

  const summary = financeSummary(bookings, expenses)
  const months = recentMonths(4)
  const monthIncome = months.map((key) =>
    bookings
      .filter((booking) => monthKey(booking.date) === key)
      .reduce((sum, booking) => sum + booking.paid, 0)
  )
  const max = Math.max(...monthIncome, 1)
  const outstanding = bookings.filter(
    (booking) => paymentStatus(booking) !== "lunas" && isSameYear(booking.date)
  )

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Keuangan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pemasukan dihitung dari uang yang sudah diterima, bukan dari nilai paket yang belum dibayar.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Pemasukan", summary.income],
          ["Pengeluaran", summary.spent],
          ["Laba bersih", summary.profit],
        ].map(([name, value]) => (
          <div key={String(name)} className="rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className="font-display text-3xl">{rupiah(Number(value))}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-2xl">Empat bulan terakhir</h2>
        <div className="mt-4 grid grid-cols-4 items-end gap-3">
          {months.map((key, index) => (
            <div key={key} className="grid justify-items-center gap-2">
              <div className="flex h-32 w-full items-end rounded-xl bg-muted">
                <div
                  className="w-full rounded-xl bg-primary"
                  style={{ height: `${Math.max((monthIncome[index] / max) * 100, 6)}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {formatMonth(`${key}-01`).split(" ")[0]}
              </p>
              <p className="text-center text-xs">{rupiah(monthIncome[index])}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <h2 className="text-2xl">Piutang {rupiah(summary.outstanding)}</h2>
          {outstanding.length === 0 ? (
            <EmptyState title="Tidak ada piutang" body="Semua jadwal tahun ini sudah lunas." />
          ) : (
            outstanding.map((booking) => (
              <div key={booking.id} className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
                <p className="font-medium">{booking.clientName}</p>
                <p className="text-muted-foreground">
                  {formatShortDate(booking.date)} · sisa {rupiah(balance(booking))}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="grid content-start gap-3">
          <h2 className="text-2xl">Pengeluaran</h2>
          <form
            className="grid gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            onSubmit={(event) => {
              event.preventDefault()
              const value = Number(amount.replace(/\D/g, ""))
              if (!label.trim() || !value) {
                setError("Isi nama pengeluaran dan jumlahnya.")
                return
              }
              addExpense({ label: label.trim(), amount: value, date: todayISO() })
              setLabel("")
              setAmount("")
              setError("")
            }}
          >
            <Label htmlFor="pengeluaran">Catat pengeluaran hari ini</Label>
            <Input id="pengeluaran" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Bensin ke lokasi" className="h-10" />
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" placeholder="150000" className="h-10" aria-label="Jumlah pengeluaran" />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit">Simpan</Button>
          </form>
          {expenses.length === 0 ? (
            <EmptyState title="Belum ada pengeluaran" body="Catat bensin, cuci gaun, atau belanja kuas supaya laba tidak terlihat lebih besar." />
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
                <div>
                  <p className="font-medium">{expense.label}</p>
                  <p className="text-muted-foreground">{formatShortDate(expense.date)}</p>
                </div>
                <p>{rupiah(expense.amount)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
