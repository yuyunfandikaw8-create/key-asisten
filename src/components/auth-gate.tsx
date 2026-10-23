"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { homePathForUser } from "@/lib/auth"
import { isTrialExpired } from "@/lib/trial"

export function AuthGate({
  children,
  allowRole = "owner",
}: {
  children: React.ReactNode
  allowRole?: "owner" | "client" | "any"
}) {
  const { ready, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    if (!user) {
      const next = encodeURIComponent(pathname || homePathForUser(null))
      router.replace(`/masuk?next=${next}`)
      return
    }
    if (allowRole !== "any" && user.role !== allowRole) {
      router.replace(homePathForUser(user))
      return
    }
    if (user.role === "owner" && isTrialExpired(user.trialStartedAt)) {
      router.replace("/trial-berakhir")
    }
  }, [allowRole, pathname, ready, router, user])

  // Keep children mounted so Next.js instant-nav validation does not drop
  // the studio page segment (which previously blocked clicks with an overlay).
  if (!ready || !user) {
    return (
      <>
        <StudioLoading />
        <div className="hidden" aria-hidden>
          {children}
        </div>
      </>
    )
  }

  if (allowRole !== "any" && user.role !== allowRole) {
    return <StudioLoading />
  }

  if (user.role === "owner" && isTrialExpired(user.trialStartedAt)) {
    return <StudioLoading />
  }

  return <>{children}</>
}
