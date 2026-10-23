import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/daftar" className="text-sm text-primary hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mt-4 font-display text-4xl">Syarat & Ketentuan</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Dengan membuat akun Key Assistant, kamu menyetujui memakai layanan untuk
          mengelola bisnis beauty, wedding, dan event secara sah dan bertanggung jawab.
        </p>
        <p>
          Akun dan ruang kerja bisnis yang kamu buat menjadi milikmu. Kamu bertanggung
          jawab atas data klien, jadwal, dan informasi yang kamu masukkan.
        </p>
        <p>
          Masa coba gratis 14 hari tersedia untuk akun owner baru. Fitur berbayar dapat
          berlaku setelah trial berakhir sesuai ketentuan yang ditampilkan di aplikasi.
        </p>
      </div>
    </main>
  )
}
