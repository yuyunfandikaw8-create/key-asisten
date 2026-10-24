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

import { HeroAppIllustration } from "@/components/hero-app-illustration"
import { buttonVariants } from "@/components/ui/button"
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
    title: "Tempel chat atau screenshot",
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
    body: "Yang belum bayar DP, yang masih nyicil, dan yang sudah lunas terpisah. Pengingat muncul H-7.",
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
  ["Sering lupa follow-up pembayaran", "Pengingat invoice muncul tepat waktu"],
  ["Invoice dibuat secara manual", "Invoice siap dikirim kapan saja"],
  ["Risiko jadwal atau pesanan bertabrakan", "Bentrok jadwal terdeteksi lebih awal"],
  [
    "Cari vendor dari banyak grup WhatsApp",
    "Cari partner vendor dalam satu aplikasi",
  ],
  [
    "Harus chat satu per satu",
    "Lebih mudah menemukan dan menghubungi partner",
  ],
  [
    "Kontak vendor tersimpan di banyak tempat",
    "Data partner lebih terorganisir",
  ],
  [
    "Butuh waktu mencari vendor yang tersedia",
    "Lebih mudah mencari partner sesuai kebutuhan",
  ],
  [
    "Harus berpindah-pindah aplikasi",
    "Semua pencarian dan komunikasi lebih praktis",
  ],
]

const roles = [
  "Make Up Artist",
  "Hijab & Hair Stylist",
  "Decoration",
  "Attire",
  "Photografer & Videografer",
  "Event & Wedding Content Creator",
]

const faqs: {
  q: string
  lead?: string
  a?: string
  items?: string[]
}[] = [
  {
    q: "✨ Apa itu Key Assistant?",
    a: "Key Assistant adalah aplikasi untuk membantu MUA dan profesional beauty mengelola bisnis dalam satu tempat — mulai dari jadwal, klien, invoice, keuangan, hingga mencari partner vendor.",
  },
  {
    q: "👩‍💼 Siapa yang bisa menggunakan Key Assistant?",
    a: "Key Assistant dirancang untuk MUA, hairstylist, fotografer, vendor wedding, dan profesional lainnya yang membutuhkan pengelolaan pekerjaan dan bisnis yang lebih teratur.",
  },
  {
    q: "💄 Apakah Key Assistant hanya untuk MUA?",
    a: "Tidak. Walaupun Key Assistant dibuat dengan kebutuhan MUA sebagai fokus utama, aplikasi ini juga dapat membantu profesional beauty dan vendor lainnya yang membutuhkan pengelolaan jadwal, klien, invoice, dan bisnis.",
  },
  {
    q: "🗂️ Apa saja yang bisa dikelola di Key Assistant?",
    a: "Kamu dapat mengelola:",
    items: [
      "📅 Jadwal dan agenda",
      "👩 Klien",
      "🧾 Invoice",
      "💰 Keuangan",
      "📝 Catatan klien",
      "🤝 Partner/vendor",
      "📊 Aktivitas bisnis",
    ],
  },
  {
    q: "💬 Apa yang bisa saya coba sekarang?",
    lead: "Langsung coba tanpa harus mulai dari nol.",
    a: "Saat pertama masuk, kamu bisa melihat data contoh supaya paham bentuk studio yang sudah terisi. Klik “Data saya” untuk kembali ke data real milik akunmu. Data contoh tidak menimpa data real.",
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
    q: "💰 Apakah klien bisa melihat pricelist?",
    lead: "Tentu. Bagikan pricelist dan biarkan klien memilih dengan mudah.",
    a: "Kamu bisa membagikan halaman pricelist melalui link, misalnya dari bio Instagram atau WhatsApp. Klien dapat melihat layanan dan harga, lalu mengajukan tanggal sesuai kebutuhannya. Data pengajuan kemudian bisa kamu gunakan untuk menindaklanjuti jadwal dan pembayaran.",
  },
  {
    q: "🤝 Apakah saya bisa mencari partner vendor?",
    a: "Bisa. Key Assistant membantu kamu menemukan partner vendor dalam satu aplikasi sehingga tidak perlu mencari dari banyak tempat.",
  },
  {
    q: "📌 Apakah saya bisa mengelola beberapa pekerjaan sekaligus?",
    a: "Bisa. Kamu dapat mengatur berbagai agenda, klien, invoice, dan aktivitas bisnis dalam satu tempat sehingga pekerjaan lebih mudah dipantau.",
  },
  {
    q: "📱 Apakah Key Assistant bisa digunakan dari HP?",
    a: "Ya. Key Assistant dirancang agar bisa dipakai dari perangkat yang kamu gunakan untuk bekerja, termasuk smartphone dan komputer.",
  },
  {
    q: "🎁 Apakah Key Assistant bisa digunakan secara gratis?",
    lead: "Ya. Pengguna baru mendapat trial gratis 14 hari.",
    a: "Selama masa trial, kamu bisa memakai seluruh fitur Key Assistant. Sisa hari trial ditampilkan di dalam aplikasi.",
  },
  {
    q: "💳 Apakah saya perlu kartu kredit untuk mencoba?",
    a: "Tidak. Kamu bisa memulai masa trial tanpa memasukkan kartu kredit.",
  },
  {
    q: "⏱️ Apa yang terjadi setelah masa trial 14 hari berakhir?",
    a: "Setelah masa trial berakhir, akses penuh Key Assistant akan dinonaktifkan sementara sampai kamu melanjutkan berlangganan. Kamu bisa memilih paket yang sesuai; data dan ketentuan akses mengikuti paket yang dipilih.",
  },
  {
    q: "🔐 Apakah data klien dan bisnis saya aman?",
    a: "Key Assistant dirancang untuk menjaga data bisnis dan informasi pengguna agar tetap terlindungi. Akses data juga dibatasi sesuai akun dan hak akses pengguna.",
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
        <section className="hero-stage mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-8 lg:py-20">
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
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/daftar" className="font-medium text-primary hover:underline">
                Daftar — Coba Gratis 14 Hari
              </Link>
            </p>
            <p className="font-script mt-6 text-2xl text-primary sm:text-3xl">
              Kerja lebih rapi, bisnis makin maju
              <span className="mt-1 block h-1 w-40 rounded-full bg-primary/35" />
            </p>
          </div>

          <HeroAppIllustration />
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
                membantu menghindari bentrok pesanan — semua dalam 1
                aplikasi.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <div className="grid grid-cols-2 bg-muted text-sm font-medium">
                <p className="px-4 py-2">Sebelum</p>
                <p className="bg-primary px-4 py-2 text-primary-foreground">Sesudah</p>
              </div>
              {beforeAfter.map(([before, after]) => (
                <div
                  key={before}
                  className="grid grid-cols-2 border-t text-sm leading-5"
                >
                  <p className="px-4 py-1.5 text-muted-foreground">{before}</p>
                  <p className="bg-accent/60 px-4 py-1.5">{after}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-4xl">Semua Vendor, Ada dalam 1 Aplikasi</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              MUA, Hijab & Hair Stylist , Fg & Vg dan vendor lainnya bisa
              bekerja sama dengan jadwal yang rapi dan waktu yang efisien.
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
                  {faq.lead ? (
                    <p className="font-semibold text-foreground">{faq.lead}</p>
                  ) : null}
                  {faq.a ? <p className={faq.lead ? "mt-1" : undefined}>{faq.a}</p> : null}
                  {faq.items?.length ? (
                    <ul className="mt-2 list-none space-y-1">
                      {faq.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
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
              Mulai uji coba gratis selama 14 hari dan lihat bagaimana jadwal,
              invoice, keuangan, serta kebutuhan klien bisa dikelola dalam 1
              tempat.
            </p>
            <div className="mt-6">
              <Link
                href="/daftar"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "h-11 rounded-2xl px-5"
                )}
              >
                ✨ Coba Gratis 14 Hari
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl">
          <p>© 2026 Key Assistant · Kelola bisnis lebih rapi, dalam satu tempat.</p>
        </div>
      </footer>
    </div>
  )
}
