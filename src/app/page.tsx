import Link from "next/link"
import {
  CalendarCheck,
  FileText,
  MessageSquareText,
  Shirt,
  Sparkles,
  Wallet,
  Globe,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { studio } from "@/lib/catalog"
import { cn } from "@/lib/utils"

function SparkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 1.5 13.4 8.2 20 12l-6.6 3.8L12 22.5l-1.4-6.7L4 12l6.6-3.8L12 1.5Z" />
    </svg>
  )
}

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
    body: "Jadwal pengambilan, pemakaian, dan pengembalian tersusun rapi berdasarkan urutan tanggal",
  },
  {
    icon: Globe,
    title: "Pricelist untuk bio",
    body: "Calon klien membuka harga, memilih paket, lalu mengajukan tanggal tanpa chat berputar-putar.",
  },
]

const beforeAfter = [
  ["Chat dan jadwal masih berantakan", "Chat dan jadwal lebih terorganisir"],
  ["Sering lupa follow-up pembayaran", "Pengingat tagihan muncul tepat waktu"],
  ["Invoice dibuat secara manual", "Invoice siap dikirim kapan saja"],
  ["Risiko jadwal atau pesanan bertabrakan", "Bentrok jadwal terdeteksi lebih awal"],
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
    q: "💬 Apa yang bisa saya coba sekarang?",
    lead: "Langsung coba tanpa harus mulai dari nol.",
    a: "Key Assistant sudah dilengkapi data seperti jadwal, data klien, koleksi gaun, invoice, dan pricelist. Kamu bisa langsung mencoba alurnya dan melihat bagaimana pekerjaan administrasi menjadi lebih cepat dan rapi.",
  },
  {
    q: "📋 Bagaimana cara kerja fitur Tempel Chat?",
    lead: "Cukup salin chat dari klien, lalu tempel.",
    a: "Key Assistant akan membantu membaca informasi penting dari percakapan, seperti nama, nomor WhatsApp, tanggal, jam, lokasi, jenis acara, dan paket yang dipilih. Kamu tinggal mengecek hasilnya, memperbaikinya jika diperlukan, lalu menyimpan.",
  },
  {
    q: "🧾 Apakah invoice langsung terkirim ke klien?",
    lead: "Kamu tetap memegang kendali.",
    a: "Key Assistant membantu menyiapkan invoice dan pesan WhatsApp berdasarkan data yang sudah tersimpan. Sebelum dikirim, kamu bisa mengecek kembali detailnya. Tidak ada pesan yang terkirim tanpa tindakan dari kamu.",
  },
  {
    q: "🔐 Di mana data saya disimpan?",
    lead: "Data kamu tetap berada di lingkungan yang kamu gunakan.",
    a: "Untuk penggunaan lokal, data dapat disimpan di browser sehingga kamu bisa mengelolanya langsung dari perangkatmu. Jika penyimpanan online tersedia dan diaktifkan, data dapat disimpan melalui layanan cloud yang terhubung dengan Key Assistant.",
  },
  {
    q: "💰 Apakah klien bisa melihat pricelist?",
    lead: "Tentu. Bagikan pricelist dan biarkan klien memilih dengan mudah.",
    a: "Kamu bisa membagikan halaman pricelist melalui link, misalnya dari bio Instagram atau WhatsApp. Klien dapat melihat layanan dan harga, lalu mengajukan tanggal sesuai kebutuhannya. Data pengajuan kemudian bisa kamu gunakan untuk menindaklanjuti jadwal dan pembayaran.",
  },
]

export default function HomePage() {
  return (
    <div className="landing-shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl text-primary">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            Key Assistant
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link href={`/p/${studio.slug}`} className="text-sm font-medium">
              Pricelist
            </Link>
            <Link
              href="/masuk"
              className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-2xl px-5")}
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-stage mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="relative">
            <SparkMark className="hero-spark absolute -left-2 -top-3 size-5 sm:size-6" />
            <SparkMark className="hero-spark hero-spark--delay absolute right-8 top-16 hidden size-4 sm:block" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Key Assistant
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-[1.08] text-balance text-primary sm:text-6xl">
              Satu aplikasi untuk jadwal yang teratur dan keuangan yang terstruktur.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Set your Schedule, Invoice, Finance, Note from Client and
              Collaborate with Other Vendors on 1 app.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/masuk"
                className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-2xl px-5")}
              >
                MASUK
              </Link>
              <Link
                href={`/p/${studio.slug}`}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 rounded-2xl bg-card/90 px-5 backdrop-blur"
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
            <p className="font-script mt-6 text-2xl text-primary sm:text-3xl">
              Kerja lebih rapi, bisnis makin maju
              <span className="mt-1 block h-1 w-40 rounded-full bg-primary/35" />
            </p>
          </div>

          <div className="relative">
            <SparkMark className="hero-spark absolute -right-1 top-6 z-10 size-5" />
            <aside className="relative rounded-[1.75rem] bg-card/95 p-4 shadow-[0_24px_50px_oklch(0.4_0.05_18_/0.14)] ring-1 ring-primary/10 backdrop-blur-sm">
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
            <div className="sticky-note absolute -top-3 -right-1 z-10 max-w-[13rem] rounded-xl px-3 py-3 sm:-right-4 sm:max-w-[14rem]">
              <p className="font-script text-lg leading-snug text-primary sm:text-xl">
                Semua lebih mudah dalam satu tempat.
              </p>
            </div>
          </div>
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
              ["Event & Wedding Content Creator", "Content reels & highlight realtime for your special day"],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl bg-card/90 p-4 shadow-sm ring-1 ring-primary/10 backdrop-blur-sm">
                <h3 className="font-display text-2xl text-primary">{title}</h3>
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
                className="flex gap-4 rounded-3xl bg-card/90 p-4 shadow-sm ring-1 ring-primary/10 backdrop-blur-sm"
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
                Kirim chat klien lewat WhatsApp, lalu biarkan Key Assistant
                mencatat jadwal, membuat invoice, memantau pembayaran, dan
                membantu menghindari bentrok pesanan — semua dalam satu
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
            <h2 className="text-center text-4xl">Semua Vendor, Satu Jadwal</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              MUA, asisten, bridal, dan vendor lainnya bisa bekerja lebih rapi
              dengan jadwal yang terkoordinasi.
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
          <div className="mt-6 divide-y rounded-3xl bg-card/90 shadow-sm ring-1 ring-primary/10 backdrop-blur-sm">
            {faqs.map((faq) => (
              <details key={faq.q} className="group px-4 py-3">
                <summary className="cursor-pointer list-none font-medium">
                  {faq.q}
                </summary>
                <div className="pt-2 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-foreground">{faq.lead}</p>
                  <p className="mt-1">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10">
            <h2 className="max-w-xl text-4xl text-balance">
              Siap membuat pekerjaan jadi lebih rapi?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/85 sm:text-lg">
              Coba Key Assistant dan lihat bagaimana jadwal, invoice, keuangan,
              serta kebutuhan klien bisa dikelola dalam satu tempat.
            </p>
            <div className="mt-6">
              <Link
                href="/masuk"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "h-11 rounded-2xl px-5"
                )}
              >
                Coba Key Assistant
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Key Assistant · Kelola bisnis lebih rapi, dalam satu tempat.</p>
          <div className="flex gap-4">
            <Link href="/masuk">Masuk</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
