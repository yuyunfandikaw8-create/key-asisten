import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"

import { AuthGate } from "@/components/auth-gate"
import { StudioLoading } from "@/components/studio-bits"
import { StudioShell } from "@/components/studio-shell"

export const metadata: Metadata = {
  title: "Studio",
}

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StudioLoading />}>
      <AuthGate>
        <StudioShell>{children}</StudioShell>
      </AuthGate>
    </Suspense>
  )
}
