"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { isStudioLocked } from "@/lib/trial"

/** Alias lama — arahkan ke Paket & Langganan. */
export default function TrialEndedRedirectPage() {
  const router = useRouter()
  const { ready, user } = useAuth()

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace("/masuk?next=%2Flangganan")
      return
    }
    if (isStudioLocked(user)) {
      router.replace("/langganan")
      return
    }
    router.replace("/studio")
  }, [ready, router, user])

  return <StudioLoading />
}
