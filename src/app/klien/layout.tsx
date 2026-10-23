import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"

import { AuthGate } from "@/components/auth-gate"
import { StudioLoading } from "@/components/studio-bits"

export const instant = false

export const metadata: Metadata = {
  title: "Beranda klien",
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StudioLoading />}>
      <AuthGate allowRole="client">{children}</AuthGate>
    </Suspense>
  )
}
