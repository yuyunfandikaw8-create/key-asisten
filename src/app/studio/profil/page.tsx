"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { BusinessProfileEditor } from "@/components/business-profile-editor"
import { StudioLoading } from "@/components/studio-bits"
import { useAuth } from "@/components/auth-provider"
import { useStudio } from "@/components/studio-provider"

export default function StudioProfilPage() {
  const { ready: authReady, user } = useAuth()
  const { ready } = useStudio()

  if (!ready || !authReady) return <StudioLoading />

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <Link
          href="/studio/menu"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Menu
        </Link>
        <h1 className="text-4xl">Profil bisnis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sama seperti langkah 4 saat daftar. Detail ini muncul di pricelist dan
          komunikasi dengan klien
          {user?.studioName ? ` · ${user.studioName}` : ""}.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <BusinessProfileEditor />
      </div>
    </div>
  )
}
