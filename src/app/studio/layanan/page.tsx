"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { BusinessServicesEditor } from "@/components/business-services-editor"
import { StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"

export default function StudioLayananPage() {
  const { ready: authReady, user } = useAuth()
  const { ready } = useStudio()
  const count = user?.services?.length ?? 0

  if (!ready || !authReady) return <StudioLoading />

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div>
        <Link
          href="/studio/menu"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Menu
        </Link>
        <h1 className="text-4xl">Layanan bisnis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sama seperti langkah 5 saat daftar. Tambah bidang, pilih paket, isi harga &
          waktu
          {count ? ` · ${count} layanan tersimpan` : ""}. Dipakai saat buat booking.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <BusinessServicesEditor />
      </div>
    </div>
  )
}
