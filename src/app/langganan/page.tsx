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
  SUBSCRIPTION_PAY_METHODS,
  SUBSCRIPTION_PLANS,
  TRIAL_DAYS,
  currentPlanLabel,
  formatTrialEndsAt,
  getTrialDaysRemaining,
  hasActiveSubscription,
  isTrialExpired,
  nowIso,
  type SubscriptionPayMethod,
} from "@/lib/trial"
import { cn } from "@/lib/utils"

export default function LanggananPage() {
  const router = useRouter()
  const { ready, user, updateProfile, logout } = useAuth()
  const [picking, setPicking] = useState(false)
  const [planId, setPlanId] = useState(SUBSCRIPTION_PLANS[0]?.id ?? "bulanan")
  const [payMethod, setPayMethod] = useState<SubscriptionPayMethod>("qris")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

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

  const daysLeft = getTrialDaysRemaining(user?.trialStartedAt)
  const endsLabel = formatTrialEndsAt(user?.trialStartedAt)
  const expired = isTrialExpired(user?.trialStartedAt)
  const active = hasActiveSubscription(user)
  const selectedPlan = useMemo(
    () => SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? SUBSCRIPTION_PLANS[0],
    [planId]
  )

  if (!ready || !user || user.role !== "owner") return <StudioLoading />

  async function subscribe() {
    if (!selectedPlan) return
    setPending(true)
    setError("")
    const updated = await updateProfile({
      subscription: {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        status: "active",
        paymentMethod: payMethod,
        startedAt: nowIso(),
      },
    })
    setPending(false)
    if (!updated) {
      setError("Gagal mengaktifkan langganan. Coba lagi.")
      return
    }
    setDone(true)
    window.setTimeout(() => router.replace("/studio"), 900)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          {!expired || active ? (
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Studio
            </Link>
          ) : (
            <Link href="/" className="font-display text-xl leading-none text-primary">
              Key Assistant
            </Link>
          )}
          <span className="ml-auto text-sm text-muted-foreground">{user.studioName || user.name}</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-lg gap-5 px-4 py-8">
        <div>
          <h1 className="text-4xl">Paket & Langganan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola trial dan langganan akun Key Assistant.
          </p>
        </div>

        <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Trial kamu
            </p>
            <p className="mt-1 font-display text-3xl">
              {active
                ? "Sudah berlangganan"
                : expired
                  ? "Sudah berakhir"
                  : daysLeft === 1
                    ? "1 hari tersisa"
                    : `${Math.max(daysLeft, 0)} hari tersisa`}
            </p>
            {!active && endsLabel ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {expired ? `Berakhir ${endsLabel}` : `Sampai ${endsLabel}`} · Trial {TRIAL_DAYS}{" "}
                hari
              </p>
            ) : null}
          </div>

          <div className="h-px bg-foreground/10" />

          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Paket saat ini
            </p>
            <p className="mt-1 text-xl font-semibold">{currentPlanLabel(user)}</p>
            {active && user.subscription ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Aktif via{" "}
                {SUBSCRIPTION_PAY_METHODS.find(
                  (item) => item.id === user.subscription?.paymentMethod
                )?.label ?? "pembayaran"}
              </p>
            ) : null}
          </div>

          {!active ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {expired
                ? "Masa trial sudah berakhir. Pilih paket untuk terus menggunakan Key Assistant."
                : "Setelah trial berakhir, pilih paket untuk terus menggunakan Key Assistant."}
            </p>
          ) : (
            <p className="rounded-xl bg-primary/8 px-3 py-3 text-sm text-primary">
              Langganan aktif. Semua fitur studio terbuka.
            </p>
          )}

          {!active && !picking ? (
            <button
              type="button"
              className={cn(buttonVariants(), "h-11")}
              onClick={() => setPicking(true)}
            >
              Pilih Paket
            </button>
          ) : null}

          {active ? (
            <Link href="/studio" className={cn(buttonVariants(), "h-11")}>
              Kembali ke Studio
            </Link>
          ) : null}
        </section>

        {picking && !active ? (
          <>
            <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <h2 className="text-2xl">Pilih paket</h2>
              <div className="grid gap-2">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const checked = planId === plan.id
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
                        name="plan"
                        checked={checked}
                        onChange={() => setPlanId(plan.id)}
                        className="mt-1 size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-sm font-semibold">
                            {rupiah(plan.price)}
                            <span className="font-normal text-muted-foreground">
                              {plan.period}
                            </span>
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {plan.blurb}
                        </span>
                      </span>
                      {checked ? <Check className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
                    </label>
                  )
                })}
              </div>
            </section>

            <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <div>
                <h2 className="text-2xl">Metode Pembayaran Langganan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilih cara bayar untuk {selectedPlan?.name.toLowerCase()}{" "}
                  {selectedPlan ? rupiah(selectedPlan.price) : null}.
                </p>
              </div>
              <div className="grid gap-2">
                {SUBSCRIPTION_PAY_METHODS.map((method) => {
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
              {done ? (
                <p className="flex items-center gap-2 text-sm text-primary">
                  <Check className="size-4" />
                  Langganan aktif — membuka studio…
                </p>
              ) : null}

              <button
                type="button"
                className={cn(buttonVariants(), "h-11")}
                disabled={pending || done}
                onClick={() => void subscribe()}
              >
                {pending ? "Memproses…" : "Bayar & Berlangganan"}
              </button>
              <p className="text-xs text-muted-foreground">
                Demo lokal: pembayaran disimulasikan dan langsung mengaktifkan paket di akun ini.
              </p>
            </section>
          </>
        ) : null}

        {expired && !active ? (
          <button
            type="button"
            className={cn(buttonVariants({ variant: "ghost" }), "h-10")}
            onClick={() => {
              void logout().then(() => router.replace("/masuk"))
            }}
          >
            Keluar
          </button>
        ) : null}
      </main>
    </div>
  )
}
