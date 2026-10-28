"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Alias lama: pilihan peran sekarang di /daftar agar tidak loncat halaman.
 */
export default function ChooseRoleRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/daftar")
  }, [router])

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-center px-4 py-10 text-sm text-muted-foreground">
      Memuat…
    </div>
  )
}
