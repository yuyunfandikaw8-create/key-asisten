"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { TRIAL_DAYS, formatTrialEndsAt, isTrialExpired } from "@/lib/trial"
import { cn } from "@/lib/utils"

export default function TrialEndedPage() {
  const router = useRouter()
  const { ready, user, logout } = useAuth()
  const endedLabel = formatTrialEndsAt(user?.trialStartedAt)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace("/masuk")
      return
    }
    if (!isTrialExpired(user.trialStartedAt)) {
      router.replace("/studio")
    }
  }, [ready, router, user])

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10 text-center">
      <Link href="/" className="font-display text-2xl text-primary">
        Key Assistant
      </Link>
      <h1 className="mt-6 text-4xl text-balance">Masa trial {TRIAL_DAYS} hari sudah berakhir</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {endedLabel
          ? `Trial akun kamu berakhir pada ${endedLabel}. `
          : null}
        Akses studio dinonaktifkan sementara. Hubungi kami untuk melanjutkan langganan Key
        Assistant.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href="mailto:hello@keyassistant.id?subject=Lanjut%20langganan%20Key%20Assistant"
          className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-2xl px-5")}
        >
          Hubungi untuk lanjut
        </a>
        <button
          type="button"
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "h-11 rounded-2xl px-5"
          )}
          onClick={() => {
            void logout().then(() => router.replace("/masuk"))
          }}
        >
          Keluar
        </button>
      </div>
      <Link href="/" className="mt-6 text-sm font-medium text-primary hover:underline">
        Kembali ke beranda
      </Link>
    </div>
  )
}
