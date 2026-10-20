import Link from "next/link"
import {
  CalendarCheck,
  FileText,
  MessageSquareText,
  Shirt,
  Wallet,
  Globe,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { studio } from "@/lib/catalog"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: MessageSquareText,
    title: "Tempel chat WhatsApp",
    body: "Nama, tanggal, jam, lokasi, dan paket diambil dari chat klien. Kamu tinggal mengoreksi sebelum disimpan.",
  },
  {
    icon: CalendarCheck,
    title: "Jadwal anti-bentrok",
    body: "Dua klien di jam yang berdekatan, atau satu gaun dipegang dua orang, langsung ketahuan.",
  },
  {
    icon: FileText,
    title: "Invoice siap kirim",
    body: "Sisa pembayaran tersusun rapi. Pesan WhatsApp-nya sudah jadi, tinggal kamu kirim.",
  },
  {
    icon: Wallet,
    title: "DP dan pelunasan",
    body: "Yang belum DP, yang masih nyicil, dan yang sudah lunas terpisah. Pengingat muncul H-7.",
  },
  {
    icon: Shirt,
    title: "Gaun tidak dobel",
    body: "Setiap kebaya punya pemakai dan tanggal kembali. Yang telat dikembalikan naik ke atas.",
  },
  {
    icon: Globe,
    title: "Pricelist untuk bio",
    body: "Calon klien membuka harga, memilih paket, lalu mengajukan tanggal tanpa chat berputar-putar.",
  },
]

const beforeAfter = [
  ["Chat klien numpuk dan tanggalnya ditebak", "Chat ditempel, tanggalnya terbaca"],
  ["DP baru diingat pas minggu acara", "Yang belum lunas muncul H-7"],
  ["Invoice diketik ulang di notes", "Tagihan siap dikirim lewat WhatsApp"],
  ["Gaun yang sama dijanjikan dua klien", "Bentrok gaun ketahuan sebelum disimpan"],
]

const roles = [
  "Make Up Artist",
  "Hijab & Hair Stylist",
  "Decoration",
  "Attire",
  "Photografer & Videografer",
  "Event & Wedding Content Creator",
]

const faqs = [
  {
    q: "Apa yang bisa dicoba sekarang?",
    a: "Studio demo BrushbyLaras di Bandung. Jadwal, invoice, gaun, dan pricelist-nya sudah terisi supaya alurnya langsung kelihatan.",
  },
  {
    q: "Bagaimana tempel chat bekerja?",
    a: "Salin percakapan klien ke kolom chat. Key Assistant membaca nama, nomor, tanggal, jam, lokasi, jenis acara, dan paket. Kamu tetap yang menekan simpan.",
  },
  {
    q: "Apakah invoice terkirim sendiri?",
    a: "Belum. Aplikasi menyusun isi tagihan dan membuka WhatsApp dengan pesan yang sudah terisi. Tombol kirim tetap di tanganmu.",
  },
  {
    q: "Di mana datanya disimpan?",
    a: "Di browser ini. Tombol data contoh mengembalikan studio BrushbyLaras. Sambungan ke Supabase menyusul setelah anon key tersedia.",
  },
  {
    q: "Bisakah klien melihat harga?",
    a: "Bisa. Halaman pricelist BrushbyLaras bisa dipasang di bio Instagram. Pengajuan tanggal dari halaman itu masuk ke jadwal studio sebagai belum DP.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="font-display text-2xl">
            Key Assistant
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link href={`/p/${studio.slug}`} className="text-sm font-medium">
              Pricelist
            </Link>
            <Link
              href="/masuk"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="text-sm font-medium tracking-wide text-primary uppercase">
              Key Assistant
            </p>
            <h1 className="mt-3 max-w-xl text-4xl leading-tight text-balance sm:text-6xl">
              Satu aplikasi untuk jadwal yang teratur dan keuangan yang terstruktur.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Set your Schedule, Invoice, Finance, Note from Client and
              Collaborate with Other Vendors on 1 app.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/masuk"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
              >
                MASUK
              </Link>
              <Link
                href={`/p/${studio.slug}`}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 bg-card px-5"
                )}
              >
                PRICE LIST
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/daftar" className="font-medium text-primary hover:underline">
                Daftar
              </Link>
            </p>
          </div>

          <aside className="rounded-3xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
            <p className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">
              Ilustrasi Tampilan Aplikasi
            </p>
            <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
              <p className="text-sm">Selamat sore</p>
              <p className="font-display text-3xl">{studio.name}</p>
              <p className="mt-4 text-xs tracking-wide uppercase opacity-80">
                Laba bersih bulan ini
              </p>
              <p className="font-display text-4xl">Rp31.650.000</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-muted px-3 py-3">
                <p className="text-muted-foreground">Pemasukan</p>
                <p className="font-medium">Rp35.950.000</p>
              </div>
              <div className="rounded-2xl bg-muted px-3 py-3">
                <p className="text-muted-foreground">Pengeluaran</p>
                <p className="font-medium">Rp4.300.000</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              {[
                ["12", "Booking"],
                ["3", "Belum DP"],
                ["2", "Belum lunas"],
                ["7", "Lunas"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-accent px-2 py-3">
                  <p className="font-display text-2xl text-accent-foreground">{value}</p>
                  <p className="text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            Kerja sama
          </p>
          <h2 className="mt-2 max-w-3xl text-4xl text-balance">
            Make Up Artist, Hijab & Hair Stylist, Decoration, Attire, Photografer & Videografer, dan Event & Wedding
            Content Creator.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Kolaborasi dan kirim pesan dengan vendor & client di satu kota yang
            sama dan membuat Best Price Bundling di 1 app.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Make Up Artist", "Brides & Groom, Reguler, Graduation, Family of Bride, Bridesmaid, etc"],
              ["Hijab & Hair Stylist", "Traditional & Modern Hijabdo, Traditional & Modern Hairdo, Simple Hijabdo & Hairdo"],
              ["Decoration", "Traditional & Modern Decoration, Decoration Setup based on client's request"],
              ["Attire", "Kebaya, Dress, Jas, etc"],
              ["Photografer & Videografer", "Photo and Video documentation for your spesial day"],
              ["Event & Wedding Content Creator", "Konten reels dan highlight untuk hari H."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
          <Link
            href="/masuk?next=/studio/partner"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-6 h-10 bg-card px-4")}
          >
            Cari partner
          </Link>
        </section>

        <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-16 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="flex gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-2xl">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </article>
            )
          })}
        </section>

        <section className="bg-card py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium tracking-wide text-primary uppercase">
                Dari chat sampai invoice
              </p>
              <h2 className="mt-2 text-4xl text-balance">
                Tiga menit mengetik ulang jadi satu kali tempel.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Klien mengirim tanggal di WhatsApp. Studio menyimpan jadwal,
                menahan gaun, lalu mengirim sisa tagihan tanpa membuka empat
                aplikasi.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <div className="grid grid-cols-2 bg-muted text-sm font-medium">
                <p className="px-4 py-3">Sebelum</p>
                <p className="bg-primary px-4 py-3 text-primary-foreground">Sesudah</p>
              </div>
              {beforeAfter.map(([before, after]) => (
                <div
                  key={before}
                  className="grid grid-cols-2 border-t text-sm leading-6"
                >
                  <p className="px-4 py-3 text-muted-foreground">{before}</p>
                  <p className="bg-accent/60 px-4 py-3">{after}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-4xl">Dipakai di sekeliling hari H</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Mejanya untuk MUA. Asisten, bridal, dan vendor yang ikut di hari
              yang sama tetap butuh satu jadwal yang sama.
            </p>
          </div>
          <div className="mt-8 overflow-hidden">
            <div className="marquee-track flex w-max gap-3">
              {[...roles, ...roles].map((role, index) => (
                <span
                  key={`${role}-${index}`}
                  className="rounded-full bg-card px-4 py-2 text-sm ring-1 ring-foreground/10"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16">
          <h2 className="text-4xl">Pertanyaan yang biasanya muncul</h2>
          <div className="mt-6 divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
            {faqs.map((faq) => (
              <details key={faq.q} className="group px-4 py-3">
                <summary className="cursor-pointer list-none font-medium">
                  {faq.q}
                </summary>
                <p className="pt-2 text-sm leading-6 text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10">
            <h2 className="max-w-xl text-4xl text-balance">
              Coba meja kerja BrushbyLaras, lalu lihat pricelist-nya seperti klien.
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/masuk"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "h-11 px-5"
                )}
              >
                Masuk ke studio
              </Link>
              <Link
                href={`/p/${studio.slug}`}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 border-primary-foreground/30 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                Buka pricelist
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Key Assistant · Meja kerja untuk MUA Indonesia</p>
          <div className="flex gap-4">
            <Link href="/masuk">Masuk</Link>
            <Link href={`/p/${studio.slug}`}>Pricelist</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
