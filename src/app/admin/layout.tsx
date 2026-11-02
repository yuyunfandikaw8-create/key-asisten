import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"

import { AdminProvider } from "@/components/admin-provider"
import { AdminShell } from "@/components/admin-shell"
import { AuthGate } from "@/components/auth-gate"
import { StudioLoading } from "@/components/studio-bits"

export const instant = false

export const metadata: Metadata = {
  title: "Server Admin",
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StudioLoading />}>
      <AuthGate allowRole="admin">
        <AdminProvider>
          <AdminShell>{children}</AdminShell>
        </AdminProvider>
      </AuthGate>
    </Suspense>
  )
}
