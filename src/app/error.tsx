"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="text-4xl">Halaman ini gagal dimuat</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Coba muat ulang. Data studio di browser tidak dihapus oleh kesalahan ini.
      </p>
      <Button className="mt-6" onClick={reset}>
        Coba lagi
      </Button>
    </main>
  )
}
