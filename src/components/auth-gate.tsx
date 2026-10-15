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

  if (!ready) return <StudioLoading />
  if (!user) return <StudioLoading />
  return <>{children}</>
}
