"use client"

import { useEffect, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { EmptyState, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PAYMENT_METHOD_OPTIONS,
  normalizePaymentSettings,
  type PaymentMethodId,
  type PaymentSettings,
} from "@/lib/auth"
import { formatMonth, formatShortDate, rupiah, todayISO } from "@/lib/format"
import { balance, financeSummary, isSameYear, monthKey, paymentStatus, recentMonths } from "@/lib/metrics"
import { cn } from "@/lib/utils"

export default function FinancePage() {
  const { user, updateProfile } = useAuth()
  const { ready, bookings, expenses, addExpense } = useStudio()
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [paymentSaved, setPaymentSaved] = useState(false)
  const [paymentPending, setPaymentPending] = useState(false)
  const [payment, setPayment] = useState<PaymentSettings>(() =>
    normalizePaymentSettings(undefined)
  )

  useEffect(() => {
    if (!user) return
    setPayment(normalizePaymentSettings(user.paymentSettings))
  }, [user])

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
  const acceptsTransfer = payment.methods.includes("transfer")
  const acceptsQris = payment.methods.includes("qris")

  function toggleMethod(id: PaymentMethodId) {
    setPaymentSaved(false)
    setPaymentError("")
    setPayment((current) => {
      const on = current.methods.includes(id)
      const methods = on
        ? current.methods.filter((item) => item !== id)
        : [...current.methods, id]
      return { ...current, methods }
    })
  }

  async function onQrisChange(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setPaymentError("Unggah file gambar untuk QRIS.")
      return
    }
    if (file.size > 1_500_000) {
      setPaymentError("Gambar QRIS maksimal sekitar 1,5 MB.")
      return
    }
    setPaymentError("")
    setPaymentSaved(false)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPayment((current) => ({ ...current, qrisDataUrl: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  async function savePayment() {
    if (!payment.methods.length) {
      setPaymentError("Pilih minimal satu metode pembayaran.")
      setPaymentSaved(false)
      return
    }
    if (acceptsTransfer) {
      if (
        !payment.bankName?.trim() ||
        !payment.accountNumber?.trim() ||
        !payment.accountHolder?.trim()
      ) {
        setPaymentError("Lengkapi bank, nomor rekening, dan nama pemilik rekening.")
        setPaymentSaved(false)
        return
      }
    }
    if (acceptsQris && !payment.qrisDataUrl) {
      setPaymentError("Unggah gambar QRIS terlebih dahulu.")
      setPaymentSaved(false)
      return
    }

    setPaymentPending(true)
    setPaymentError("")
    setPaymentSaved(false)
    const next = normalizePaymentSettings({
      ...payment,
      bankName: payment.bankName?.trim(),
      accountNumber: payment.accountNumber?.trim(),
      accountHolder: payment.accountHolder?.trim(),
    })
    const updated = await updateProfile({ paymentSettings: next })
    setPaymentPending(false)
    if (!updated) {
      setPaymentError("Gagal menyimpan. Coba lagi.")
      return
    }
    setPayment(next)
    setPaymentSaved(true)
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Keuangan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pemasukan dihitung dari uang yang sudah diterima, bukan dari nilai paket yang belum dibayar.
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Metode pembayaran yang diterima</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Centang metode yang bisa dipakai klien. Detail rekening dan QRIS muncul di invoice.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const checked = payment.methods.includes(option.id)
            return (
              <label
                key={option.id}
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
                  onChange={() => toggleMethod(option.id)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            )
          })}
        </div>

        {acceptsTransfer ? (
          <div className="grid gap-3 rounded-xl bg-muted/30 p-4">
            <p className="text-sm font-medium">Transfer Bank</p>
            <div className="grid gap-1.5">
              <Label htmlFor="pay-bank">Bank</Label>
              <Input
                id="pay-bank"
                value={payment.bankName ?? ""}
                onChange={(event) => {
                  setPaymentSaved(false)
                  setPayment((current) => ({ ...current, bankName: event.target.value }))
                }}
                placeholder="Contoh: BCA, Mandiri, BRI"
                className="h-10 bg-background"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pay-rek">Nomor rekening</Label>
              <Input
                id="pay-rek"
                value={payment.accountNumber ?? ""}
                onChange={(event) => {
                  setPaymentSaved(false)
                  setPayment((current) => ({
                    ...current,
                    accountNumber: event.target.value.replace(/\D/g, ""),
                  }))
                }}
                inputMode="numeric"
                placeholder="Nomor rekening"
                className="h-10 bg-background"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pay-holder">Nama pemilik rekening</Label>
              <Input
                id="pay-holder"
                value={payment.accountHolder ?? ""}
                onChange={(event) => {
                  setPaymentSaved(false)
                  setPayment((current) => ({
                    ...current,
                    accountHolder: event.target.value,
                  }))
                }}
                placeholder="Sesuai buku tabungan"
                className="h-10 bg-background"
              />
            </div>
          </div>
        ) : null}

        {acceptsQris ? (
          <div className="grid gap-3 rounded-xl bg-muted/30 p-4">
            <p className="text-sm font-medium">QRIS</p>
            <Label>Upload gambar QRIS</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-foreground/20 bg-background px-4 py-4 transition hover:bg-muted/40">
              {payment.qrisDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={payment.qrisDataUrl}
                  alt="QRIS"
                  className="size-20 rounded-lg object-cover"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-lg bg-muted">
                  <ImagePlus className="size-5 text-muted-foreground" />
                </span>
              )}
              <span className="text-sm font-medium">
                {payment.qrisDataUrl ? "Ganti gambar QRIS" : "+ Unggah QRIS"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void onQrisChange(event.target.files?.[0] ?? null)}
              />
            </label>
            {payment.qrisDataUrl ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setPaymentSaved(false)
                  setPayment((current) => ({ ...current, qrisDataUrl: undefined }))
                }}
              >
                <Trash2 className="size-3.5" />
                Hapus gambar QRIS
              </button>
            ) : null}
          </div>
        ) : null}

        {paymentError ? <p className="text-sm text-destructive">{paymentError}</p> : null}
        {paymentSaved ? (
          <p className="text-sm text-primary">Metode pembayaran tersimpan.</p>
        ) : null}

        <button
          type="button"
          className={cn(buttonVariants(), "h-11 w-full sm:w-auto")}
          disabled={paymentPending}
          onClick={() => void savePayment()}
        >
          {paymentPending ? "Menyimpan…" : "Simpan metode pembayaran"}
        </button>
      </section>

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
          <h2 className="text-2xl">Tagihan Klien {rupiah(summary.outstanding)}</h2>
          {outstanding.length === 0 ? (
            <EmptyState
              title="Tidak ada Tagihan Klien"
              body="Semua jadwal tahun ini sudah lunas."
            />
          ) : (
            outstanding.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
              >
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
            <Input
              id="pengeluaran"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Bensin ke lokasi"
              className="h-10"
            />
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="numeric"
              placeholder="150000"
              className="h-10"
              aria-label="Jumlah pengeluaran"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit">Simpan</Button>
          </form>
          {expenses.length === 0 ? (
            <EmptyState
              title="Belum ada pengeluaran"
              body="Catat bensin, cuci gaun, atau belanja kuas supaya laba tidak terlihat lebih besar."
            />
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
              >
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
