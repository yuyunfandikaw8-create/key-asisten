"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { homePathForUser } from "@/lib/auth"
import { rupiah } from "@/lib/format"
import {
  canUseOperationalFeatures,
  formatDateId,
  formatPlanPrice,
  formatTrialEndsAt,
  getLanggananHeadline,
  getMainPlan,
  getPlanOptions,
  getServerNotice,
  getSubscriptionPayMethods,
  getSubscriptionStatus,
  getTrialDays,
  getTrialDaysRemaining,
  hasActiveSubscription,
  isPricingPublished,
  isStudioReadOnly,
  isTrialExpired,
  nextInvoiceNumber,
  nowIso,
  periodEndsAt,
  subscriptionStatusLabel,
  type SubscriptionPayMethod,
  type SubscriptionPaymentRecord,
  type SubscriptionPeriod,
} from "@/lib/trial"
import { cn } from "@/lib/utils"

export default function LanggananPage() {
  const router = useRouter()
  const { ready, user, updateProfile, logout } = useAuth()
  const [picking, setPicking] = useState(false)
  const [period, setPeriod] = useState<SubscriptionPeriod>("monthly")
  const [payMethod, setPayMethod] = useState<SubscriptionPayMethod>("qris")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace(`/masuk?next=${encodeURIComponent("/langganan")}`)
      return
    }
    if (user.role !== "owner") {
      router.replace(homePathForUser(user))
    }
  }, [ready, router, user])

  const [tick, setTick] = useState(0)
  useEffect(() => {
    setTick((value) => value + 1)
  }, [])
  const mainPlan = useMemo(() => getMainPlan(), [tick])
  const planOptions = useMemo(() => getPlanOptions(), [tick])
  const payMethods = useMemo(() => getSubscriptionPayMethods(), [tick])
  const serverNotice = useMemo(() => getServerNotice(), [tick])
  const trialDays = useMemo(() => getTrialDays(), [tick])
  useEffect(() => {
    if (!payMethods.some((item) => item.id === payMethod) && payMethods[0]) {
      setPayMethod(payMethods[0].id)
    }
  }, [payMethod, payMethods])
  const selectedPlan = useMemo(
    () => planOptions.find((plan) => plan.id === period) ?? planOptions[0],
    [period, planOptions]
  )
  const status = getSubscriptionStatus(user)
  const daysLeft = getTrialDaysRemaining(user?.trialStartedAt)
  const trialEndsLabel = formatTrialEndsAt(user?.trialStartedAt)
  const expired = isTrialExpired(user?.trialStartedAt)
  const active = hasActiveSubscription(user)
  const readOnly = isStudioReadOnly(user)
  const payments = user?.subscription?.payments ?? []
  const headline = getLanggananHeadline(user)
  const pricingReady = isPricingPublished()

  if (!ready || !user || user.role !== "owner") return <StudioLoading />

  const owner = user

  async function submitPayment() {
    if (!selectedPlan) return
    if (!pricingReady || typeof selectedPlan.price !== "number") {
      setError(
        "Harga paket belum ditetapkan. Pembayaran langganan akan dibuka setelah harga final."
      )
      return
    }
    setPending(true)
    setError("")
    setNotice("")
    const createdAt = nowIso()
    const payment: SubscriptionPaymentRecord = {
      id: crypto.randomUUID(),
      invoiceNumber: nextInvoiceNumber(payments.length),
      amount: selectedPlan.price,
      period,
      paymentMethod: payMethod,
      status: "pending",
      createdAt,
    }
    const updated = await updateProfile({
      subscription: {
        planId: mainPlan.id,
        planName: selectedPlan.name,
        status: "pending",
        period,
        paymentMethod: payMethod,
        startedAt: owner.subscription?.startedAt || createdAt,
        endsAt: owner.subscription?.endsAt,
        payments: [...payments, payment],
      },
    })
    setPending(false)
    if (!updated) {
      setError("Gagal mencatat pembayaran. Coba lagi.")
      return
    }
    setPicking(false)
    setNotice(
      "Pembayaran tercatat berstatus pending. Paket aktif hanya setelah verifikasi — redirect sukses bukan bukti cukup."
    )
  }

  async function verifyPaymentDemo() {
    const latestPending = [...payments]
      .reverse()
      .find((item) => item.status === "pending")
    if (!latestPending) {
      setError("Tidak ada pembayaran pending untuk diverifikasi.")
      return
    }
    setPending(true)
    setError("")
    const paidAt = nowIso()
    const periodValue = latestPending.period
    const endsAt = periodEndsAt(paidAt, periodValue)
    const nextPayments = payments.map((item) =>
      item.id === latestPending.id
        ? { ...item, status: "paid" as const, paidAt }
        : item
    )
    const planName =
      planOptions.find((plan) => plan.id === periodValue)?.name ||
      owner.subscription?.planName ||
      mainPlan.name
    const updated = await updateProfile({
      subscription: {
        planId: mainPlan.id,
        planName,
        status: "active",
        period: periodValue,
        paymentMethod: latestPending.paymentMethod,
        startedAt: paidAt,
        endsAt,
        payments: nextPayments,
      },
    })
    setPending(false)
    if (!updated) {
      setError("Gagal memverifikasi pembayaran.")
      return
    }
    setNotice("Pembayaran diverifikasi. Status langganan sekarang active.")
  }

  const ctaLabel = !pricingReady
    ? "Lihat detail paket"
    : active
      ? "Perpanjang Langganan"
      : expired || status === "expired"
        ? "Berlangganan"
        : "Pilih Paket"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Studio
          </Link>
          <span className="ml-auto text-sm text-muted-foreground">
            {user.studioName || user.name}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-lg gap-5 px-4 py-8">
        <div>
          <h1 className="text-4xl">Paket & Langganan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pusat status langganan Owner ke Key Assistant. Pembayaran jasa klien
            ke vendor tetap terpisah di invoice bisnis.
          </p>
        </div>

        {serverNotice ? (
          <p className="rounded-2xl bg-accent px-4 py-3 text-sm">{serverNotice}</p>
        ) : null}

        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Status
            </p>
            <p className="mt-1 font-display text-3xl">
              {subscriptionStatusLabel(status)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{headline}</p>
          </div>

          <div className="h-px bg-foreground/10" />

          <dl className="grid gap-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Paket</dt>
              <dd className="text-right font-medium">
                {user.subscription?.planName || mainPlan.name}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Harga</dt>
              <dd className="text-right font-medium">
                {pricingReady
                  ? `${formatPlanPrice(mainPlan.priceMonthly)}/bln · ${formatPlanPrice(mainPlan.priceYearly)}/thn`
                  : "Belum ditetapkan"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Periode</dt>
              <dd className="text-right font-medium">
                {user.subscription?.period === "yearly"
                  ? "Tahunan"
                  : user.subscription?.period === "monthly"
                    ? "Bulanan"
                    : status === "trial"
                      ? `Trial ${trialDays} hari`
                      : "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Mulai trial</dt>
              <dd className="text-right font-medium">
                {formatDateId(user.trialStartedAt) || "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">Berakhir trial</dt>
              <dd className="text-right font-medium">{trialEndsLabel || "—"}</dd>
            </div>
            {!active && status === "trial" ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Sisa trial</dt>
                <dd className="text-right font-medium">
                  {daysLeft <= 0
                    ? "Berakhir"
                    : daysLeft === 1
                      ? "Berakhir hari ini"
                      : `${daysLeft} hari`}
                </dd>
              </div>
            ) : null}
            {user.subscription?.startedAt ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Mulai langganan</dt>
                <dd className="text-right font-medium">
                  {formatDateId(user.subscription.startedAt)}
                </dd>
              </div>
            ) : null}
            {user.subscription?.endsAt ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Berakhir langganan</dt>
                <dd className="text-right font-medium">
                  {formatDateId(user.subscription.endsAt)}
                </dd>
              </div>
            ) : null}
          </dl>

          {readOnly ? (
            <p className="rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground">
              Akses operasional dibatasi. Data lama (booking, jadwal, invoice,
              klien, layanan, portofolio) tetap bisa dilihat — tidak dihapus.
            </p>
          ) : null}

          {!pricingReady ? (
            <p className="rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground">
              Harga bulanan dan tahunan belum ditetapkan. Menu ini tetap
              menampilkan status trial/langganan; tombol bayar akan aktif setelah
              harga final diisi di konfigurasi paket.
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-xl bg-primary/8 px-3 py-3 text-sm text-primary">
              {notice}
            </p>
          ) : null}

          {!picking ? (
            <button
              type="button"
              className={cn(buttonVariants(), "h-11")}
              onClick={() => {
                setPicking(true)
                setError("")
                setNotice("")
              }}
            >
              {ctaLabel}
            </button>
          ) : null}

          {status === "pending" ? (
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-11")}
              disabled={pending}
              onClick={() => void verifyPaymentDemo()}
            >
              {pending ? "Memverifikasi…" : "Simulasikan verifikasi pembayaran"}
            </button>
          ) : null}

          <Link
            href="/studio"
            className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
          >
            {canUseOperationalFeatures(user)
              ? "Kembali ke Studio"
              : "Lihat Data Saya (read-only)"}
          </Link>
        </section>

        {picking ? (
          <>
            <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <div>
                <h2 className="text-2xl">Pilih periode paket</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Satu paket {mainPlan.name}. Periode bulanan atau tahunan
                  {pricingReady ? "" : " — harga final belum ditetapkan"}.
                </p>
              </div>
              <div className="grid gap-2">
                {planOptions.map((plan) => {
                  const checked = period === plan.id
                  return (
                    <label
                      key={plan.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 ring-1 transition",
                        checked
                          ? "bg-primary/8 ring-primary"
                          : "bg-background ring-foreground/10 hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="period"
                        checked={checked}
                        onChange={() => setPeriod(plan.id)}
                        className="mt-1 size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-sm font-semibold">
                            {formatPlanPrice(plan.price)}
                            {plan.price ? (
                              <span className="font-normal text-muted-foreground">
                                {plan.periodLabel}
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {plan.blurb}
                        </span>
                      </span>
                      {checked ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      ) : null}
                    </label>
                  )
                })}
              </div>
            </section>

            {pricingReady ? (
              <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                <div>
                  <h2 className="text-2xl">Metode pembayaran langganan</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Transaksi Owner kepada Key Assistant
                    {selectedPlan
                      ? ` · ${selectedPlan.name} ${formatPlanPrice(selectedPlan.price)}`
                      : null}
                    .
                  </p>
                </div>
                <div className="grid gap-2">
                  {payMethods.map((method) => {
                    const checked = payMethod === method.id
                    return (
                      <label
                        key={method.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ring-1 transition",
                          checked
                            ? "bg-primary/8 ring-primary"
                            : "bg-background ring-foreground/10 hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="pay"
                          checked={checked}
                          onChange={() => setPayMethod(method.id)}
                          className="size-4 accent-primary"
                        />
                        <span className="text-sm font-medium">{method.label}</span>
                      </label>
                    )
                  })}
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <button
                  type="button"
                  className={cn(buttonVariants(), "h-11")}
                  disabled={pending}
                  onClick={() => void submitPayment()}
                >
                  {pending ? "Mencatat…" : "Bayar & ajukan langganan"}
                </button>
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
                  onClick={() => setPicking(false)}
                >
                  Batal
                </button>
                <p className="text-xs text-muted-foreground">
                  Status awal: pending. Active hanya setelah verifikasi (demo:
                  tombol simulasi di kartu status).
                </p>
              </section>
            ) : (
              <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                <div>
                  <h2 className="text-2xl">Pembayaran belum dibuka</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Karena harga belum ditetapkan, Owner masih bisa memakai trial
                    dan melihat status di halaman ini. Admin mengisi harga di
                    menu server (/admin/paket) — lalu tombol bayar muncul di
                    sini.
                  </p>
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
                  onClick={() => setPicking(false)}
                >
                  Tutup
                </button>
              </section>
            )}
          </>
        ) : null}

        <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h2 className="text-2xl">Riwayat pembayaran</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Catatan pembayaran langganan ke Key Assistant.
            </p>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
          ) : (
            <ul className="grid gap-2">
              {[...payments].reverse().map((payment) => (
                <li
                  key={payment.id}
                  className="rounded-xl bg-background px-3 py-3 text-sm ring-1 ring-foreground/10"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{payment.invoiceNumber}</span>
                    <span className="font-semibold">{rupiah(payment.amount)}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {payment.period === "yearly" ? "Tahunan" : "Bulanan"} ·{" "}
                    {payMethods.find(
                      (item) => item.id === payment.paymentMethod
                    )?.label || payment.paymentMethod}{" "}
                    · {payment.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dibuat {formatDateId(payment.createdAt)}
                    {payment.paidAt
                      ? ` · Dibayar ${formatDateId(payment.paidAt)}`
                      : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
          onClick={() => {
            void logout().then(() => router.replace("/masuk"))
          }}
        >
          Keluar
        </button>
      </main>
    </div>
  )
}
