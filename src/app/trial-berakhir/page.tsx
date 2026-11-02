"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { hasActiveSubscription, isStudioReadOnly } from "@/lib/trial"

/** Alias lama — arahkan ke Paket & Langganan atau Studio (data tetap bisa dilihat). */
export default function TrialEndedRedirectPage() {
  const router = useRouter()
  const { ready, user } = useAuth()

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace("/masuk?next=%2Flangganan")
      return
    }
    if (hasActiveSubscription(user)) {
      router.replace("/studio")
      return
    }
    if (isStudioReadOnly(user)) {
      router.replace("/langganan")
      return
    }
    router.replace("/studio")
  }, [ready, router, user])

  return <StudioLoading />
}
