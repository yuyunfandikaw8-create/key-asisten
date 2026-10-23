import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"

import { AuthGate } from "@/components/auth-gate"
import { StudioLoading } from "@/components/studio-bits"

export const instant = false

export const metadata: Metadata = {
  title: "Siapkan bisnis",
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StudioLoading />}>
      <AuthGate allowRole="owner" skipOnboardingRedirect>
        {children}
      </AuthGate>
    </Suspense>
  )
}
