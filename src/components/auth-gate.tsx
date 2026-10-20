"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    if (!user) {
      const next = encodeURIComponent(pathname || "/studio")
      router.replace(`/masuk?next=${next}`)
    }
  }, [pathname, ready, router, user])

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

  return <>{children}</>
}
