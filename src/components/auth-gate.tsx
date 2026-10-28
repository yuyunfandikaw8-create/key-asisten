"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { homePathForUser } from "@/lib/auth"
import { needsOnboarding } from "@/lib/onboarding"
import { isStudioLocked } from "@/lib/trial"

export function AuthGate({
  children,
  allowRole = "owner",
  skipOnboardingRedirect = false,
}: {
  children: React.ReactNode
  allowRole?: "owner" | "client" | "any"
  /** Set true on /onboarding so incomplete owners are not bounced in a loop. */
  skipOnboardingRedirect?: boolean
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
    if (user.roleChosen === false) {
      router.replace("/daftar")
      return
    }
    if (allowRole !== "any" && user.role !== allowRole) {
      router.replace(homePathForUser(user))
      return
    }
    if (!skipOnboardingRedirect && needsOnboarding(user)) {
      router.replace("/onboarding")
      return
    }
    if (
      skipOnboardingRedirect &&
      !needsOnboarding(user) &&
      pathname.startsWith("/onboarding")
    ) {
      router.replace("/studio")
      return
    }
    if (user.role === "owner" && isStudioLocked(user)) {
      router.replace("/langganan")
    }
  }, [allowRole, pathname, ready, router, skipOnboardingRedirect, user])

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

  if (user.roleChosen === false) {
    return <StudioLoading />
  }

  if (allowRole !== "any" && user.role !== allowRole) {
    return <StudioLoading />
  }

  if (!skipOnboardingRedirect && needsOnboarding(user)) {
    return <StudioLoading />
  }

  if (user.role === "owner" && isStudioLocked(user)) {
    return <StudioLoading />
  }

  return <>{children}</>
}
