"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  Globe,
  Handshake,
  Inbox,
  LayoutDashboard,
  MapPin,
  Plus,
  Receipt,
  Scissors,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { EmptyState, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Input } from "@/components/ui/input"
import { studio } from "@/lib/catalog"
import { formatFieldsSummary } from "@/lib/onboarding"
import { studioBrand } from "@/lib/studio-brand"
import { cn } from "@/lib/utils"

type MenuItem = {
  href: string
  title: string
  body: string
  Icon: typeof CalendarDays
  tone: string
}

type MenuSection = {
  id: string
  label: string
  items: MenuItem[]
}

const sections: MenuSection[] = [
  {
    id: "operasional",
    label: "Operasional",
    items: [
      {
        href: "/studio",
        title: "Beranda",
        body: "Laba, hari ini, besok, dan yang perlu dilihat",
        Icon: LayoutDashboard,
        tone: "bg-[oklch(0.93_0.04_15)] text-[oklch(0.45_0.12_15)]",
      },
      {
        href: "/studio/jadwal",
        title: "Jadwal",
        body: "Kelola jadwal dan booking dengan mudah",
        Icon: CalendarDays,
        tone: "bg-[oklch(0.93_0.04_220)] text-[oklch(0.42_0.1_220)]",
      },
      {
        href: "/studio/jadwal/baru",
        title: "Booking baru",
        body: "Tempel chat / screenshot WA·IG, atau isi manual",
        Icon: Plus,
        tone: "bg-[oklch(0.93_0.05_145)] text-[oklch(0.4_0.1_145)]",
      },
      {
        href: "/studio/invoice",
        title: "Invoice",
        body: "Kelola invoice dan pembayaran klien dengan lebih mudah",
        Icon: FileText,
        tone: "bg-[oklch(0.94_0.03_350)] text-[oklch(0.45_0.1_350)]",
      },
      {
        href: "/studio/inbox",
        title: "Inbox partner",
        body: "Chat Make Up Artist, hair, Decoration, Attire, foto, dan konten",
        Icon: Inbox,
        tone: "bg-[oklch(0.94_0.04_75)] text-[oklch(0.45_0.1_55)]",
      },
      {
        href: "/studio/profil",
        title: "Profil",
        body: "Logo, nama, WhatsApp, Instagram, kota",
        Icon: UserRound,
        tone: "bg-[oklch(0.94_0.03_15)] text-[oklch(0.48_0.1_15)]",
      },
      {
        href: "/studio/layanan",
        title: "Layanan & harga",
        body: "Bidang, paket, harga, dan durasi",
        Icon: BriefcaseBusiness,
        tone: "bg-[oklch(0.93_0.04_340)] text-[oklch(0.45_0.1_340)]",
      },
    ],
  },
  {
    id: "kerja-sama",
    label: "Kerja sama",
    items: [
      {
        href: "/studio/partner",
        title: "Cari partner",
        body: "Ajak kerja sama di kota aktif, lalu buat kombo",
        Icon: Handshake,
        tone: "bg-[oklch(0.93_0.04_15)] text-[oklch(0.45_0.12_15)]",
      },
      {
        href: "/studio/partner",
        title: "Make Up & Hair Stylist",
        body: "Saring Make Up Artist serta Hijab & Hair Stylist lokal",
        Icon: Scissors,
        tone: "bg-[oklch(0.94_0.03_320)] text-[oklch(0.45_0.1_320)]",
      },
      {
        href: `/p/${studio.slug}`,
        title: "Pricelist & kombo publik",
        body: "Taruh di bio. Klien ajukan tanggal sendiri",
        Icon: Globe,
        tone: "bg-[oklch(0.93_0.04_250)] text-[oklch(0.42_0.1_250)]",
      },
    ],
  },
  {
    id: "aset",
    label: "Manajemen aset",
    items: [
      {
        href: "/studio/layanan",
        title: "Katalog layanan & harga",
        body: "Kelola paket, harga, dan durasi milik bisnis kamu",
        Icon: Sparkles,
        tone: "bg-[oklch(0.94_0.04_75)] text-[oklch(0.45_0.1_55)]",
      },
      {
        href: "/studio/keuangan",
        title: "Arus kas & laporan",
        body: "Pemasukan, pengeluaran, dan Tagihan Klien",
        Icon: Wallet,
        tone: "bg-[oklch(0.93_0.04_160)] text-[oklch(0.4_0.09_160)]",
      },
      {
        href: "/studio/invoice",
        title: "Flyer invoice",
        body: "Cetak atau bagikan invoice blush yang rapi",
        Icon: Receipt,
        tone: "bg-[oklch(0.94_0.03_15)] text-[oklch(0.48_0.1_15)]",
      },
    ],
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    items: [
      {
        href: "/studio/menu#lokasi",
        title: "Lokasi aktif",
        body: "Bandung, Surabaya, Jakarta, dan kota lain",
        Icon: MapPin,
        tone: "bg-[oklch(0.93_0.04_220)] text-[oklch(0.42_0.1_220)]",
      },
      {
        href: "/studio/profil",
        title: "Identitas & rekening",
        body: "Nama studio, Instagram, dan profil bisnis",
        Icon: Settings2,
        tone: "bg-[oklch(0.94_0.02_80)] text-[oklch(0.42_0.05_60)]",
      },
      {
        href: `/p/${studio.slug}`,
        title: "Link booking mandiri",
        body: "Link untuk diisi calon klien",
        Icon: Globe,
        tone: "bg-[oklch(0.93_0.04_250)] text-[oklch(0.42_0.1_250)]",
      },
    ],
  },
]

export default function MenuPage() {
  const { user } = useAuth()
  const { ready, city, messages, partnerships, combos, viewMode } = useStudio()
  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const [query, setQuery] = useState("")

  const unread = messages.filter(
    (message) => message.city === city && message.sender === "partner" && !message.read
  ).length
  const partnersCount = partnerships.filter((item) => item.status === "diterima").length
  const comboCount = combos.filter((combo) => combo.published).length

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return sections
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const haystack = `${section.label} ${item.title} ${item.body}`.toLowerCase()
          return haystack.includes(needle)
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [query])

  if (!ready) return <StudioLoading />

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Menu</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Semua pintasan studio dalam satu tempat. Cari jadwal, partner, invoice, aset, atau pengaturan.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari menu, invoice, partner, lokasi…"
          aria-label="Cari menu"
          className="h-11 bg-card pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Lokasi aktif</p>
          <p className="mt-1 font-display text-2xl">{city}</p>
        </div>
        <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Inbox</p>
          <p className="mt-1 font-display text-2xl">{unread} belum dibaca</p>
        </div>
        <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Partner & kombo</p>
          <p className="mt-1 font-display text-2xl">
            {partnersCount} · {comboCount}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Tidak ada menu yang cocok"
          body={`Tidak ada pintasan yang memuat “${query}”. Coba kata lain seperti invoice atau partner.`}
        />
      ) : (
        visible.map((section) => (
          <section key={section.id} className="grid gap-3">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {section.label}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={`${section.id}-${item.title}`}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10 transition hover:bg-accent/40"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      item.tone
                    )}
                  >
                    <item.Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.title}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{item.body}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <section id="lokasi" className="scroll-mt-24 grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <h2 className="text-2xl">Lokasi aktif</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Partner dan inbox hanya menampilkan kota yang dipilih di header. Sekarang aktif di{" "}
          <span className="font-medium text-foreground">{city}</span>. Ganti ke Surabaya atau kota
          lain dari menu lokasi di atas.
        </p>
      </section>

            <section id="identitas" className="scroll-mt-24 grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-primary" />
            <h2 className="text-2xl">Identitas & rekening</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/studio/profil" className="font-medium text-primary hover:underline">
              Edit profil
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/studio/layanan" className="font-medium text-primary hover:underline">
              Edit layanan
            </Link>
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Studio</dt>
            <dd className="font-medium">{brand.name}</dd>
            <dd>
              {brand.owner}
              {brand.instagram ? ` · ${brand.instagram}` : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kontak</dt>
            <dd className="font-medium">{brand.phone}</dd>
            <dd>{brand.address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Metode pembayaran</dt>
            <dd className="font-medium">
              {brand.payment.methods
                .map((id) =>
                  id === "transfer"
                    ? "Transfer Bank"
                    : id === "qris"
                      ? "QRIS"
                      : id === "ewallet"
                        ? "E-Wallet"
                        : "Cash"
                )
                .join(" · ") || "Belum diatur"}
            </dd>
            <dd>
              {brand.payment.methods.includes("transfer")
                ? `${brand.bank} · ${brand.accountName} · ${brand.accountNumber}`
                : "Atur di Menu → Keuangan"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Layanan terdaftar</dt>
            <dd className="font-medium">
              {user?.services?.length
                ? `${user.services.length} paket / layanan`
                : "Belum ada — tambah di Layanan & harga"}
            </dd>
            <dd>{formatFieldsSummary(user?.businessFields)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
