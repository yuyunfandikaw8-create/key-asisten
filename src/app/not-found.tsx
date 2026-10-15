import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="text-4xl">Halaman tidak ada</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Alamat ini tidak termasuk studio, jadwal, atau pricelist.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-primary">
        Kembali ke beranda
      </Link>
    </main>
  )
}
