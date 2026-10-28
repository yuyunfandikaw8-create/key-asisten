import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"

import { AuthGate } from "@/components/auth-gate"
import { ClientProvider } from "@/components/client-provider"
import { ClientShell } from "@/components/client-shell"
import { StudioLoading } from "@/components/studio-bits"

export const instant = false

export const metadata: Metadata = {
  title: "Klien",
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StudioLoading />}>
      <AuthGate allowRole="client">
        <ClientProvider>
          <ClientShell>{children}</ClientShell>
        </ClientProvider>
      </AuthGate>
    </Suspense>
  )
}
