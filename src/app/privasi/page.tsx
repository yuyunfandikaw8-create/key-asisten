import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/daftar" className="text-sm text-primary hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mt-4 font-display text-4xl">Kebijakan Privasi</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Key Assistant menyimpan data akun dan bisnis yang kamu berikan agar layanan
          dapat berjalan — termasuk nama, email, kontak, dan data operasional studio.
        </p>
        <p>
          Di mode lokal, data disimpan di perangkat/browser kamu. Jika integrasi cloud
          aktif, data dikirim ke penyedia autentikasi yang dikonfigurasi untuk proyek ini.
        </p>
        <p>
          Kami tidak menjual data pribadimu. Kamu dapat meminta penghapusan akun dengan
          menghapus data lokal atau menghubungi pengelola layanan.
        </p>
      </div>
    </main>
  )
}
