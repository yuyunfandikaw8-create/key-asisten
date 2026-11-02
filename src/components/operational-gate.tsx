"use client"

import Link from "next/link"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { canUseOperationalFeatures } from "@/lib/trial"
import { cn } from "@/lib/utils"

/** Blokir aksi buat/ubah operasional saat trial/langganan berakhir (data lama tetap ada). */
export function OperationalGate({
  children,
  actionLabel = "membuat atau mengubah data operasional",
}: {
  children: React.ReactNode
  actionLabel?: string
}) {
  const { user } = useAuth()
  if (!user || user.role !== "owner" || canUseOperationalFeatures(user)) {
    return <>{children}</>
  }

  return (
    <div className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div>
        <h2 className="text-2xl">Fitur operasional dibatasi</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Masa trial atau langganan telah berakhir. Kamu masih bisa melihat data
          lama, tetapi {actionLabel} memerlukan langganan aktif ke Key Assistant.
          Data tidak dihapus.
        </p>
      </div>
      <Link href="/langganan" className={cn(buttonVariants(), "h-11 w-fit")}>
        Berlangganan
      </Link>
    </div>
  )
}
