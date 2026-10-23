"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import {
  CalendarDays,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  RotateCcw,
  Shirt,
  UserRound,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { studio } from "@/lib/catalog"
import { studioBrand } from "@/lib/studio-brand"
import { useAuth } from "@/components/auth-provider"
import { CitySearchPicker } from "@/components/city-search-picker"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import {
  TRIAL_DAYS,
  formatTrialEndsAt,
  getTrialDaysRemaining,
  trialStatusLabel,
} from "@/lib/trial"
import { cn } from "@/lib/utils"

const links = [
  { href: "/studio", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/studio/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/studio/invoice", label: "Invoice", icon: FileText },
  { href: "/studio/inbox", label: "Inbox", icon: Inbox },
  { href: "/studio/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/studio/gaun", label: "Gaun", icon: Shirt },
  { href: "/studio/partner", label: "Partner", icon: Handshake },
  { href: "/studio/menu", label: "Menu", icon: LayoutGrid },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SideNav() {
  const pathname = usePathname()
  const { messages, city } = useStudio()
  const unread = messages.filter(
    (message) => message.city === city && message.sender === "partner" && !message.read
  ).length

  return (
    <nav className="studio-chrome hidden md:flex md:flex-col md:gap-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link.href, link.exact)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{link.label}</span>
            {link.href === "/studio/inbox" && unread > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] leading-5",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {unread}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileNav() {
  const pathname = usePathname()
  const { messages, city } = useStudio()
  const unread = messages.filter(
    (message) => message.city === city && message.sender === "partner" && !message.read
  ).length

  return (
    <nav className="studio-chrome fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
      <div className="flex overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(pathname, link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex min-w-[4.5rem] flex-col items-center gap-1 px-2 py-2 text-[11px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {link.label}
              {link.href === "/studio/inbox" && unread > 0 ? (
                <span className="absolute top-1 right-2 size-1.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function CityPicker() {
  const { city, setCity, viewMode } = useStudio()
  const ownerOnly = viewMode === "real"

  // Di data contoh: tampilkan chip (bukan tombol disabled) agar tidak menghalangi /
  // menyesatkan klik tombol header lain.
  if (!ownerOnly) {
    return (
      <span
        className="inline-flex h-8 max-w-[9.5rem] items-center gap-1.5 truncate rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground sm:max-w-[11rem] sm:text-sm"
        title="Wilayah terkunci di data contoh. Ganti hanya di Data saya oleh owner."
      >
        <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span className="truncate">{city}</span>
      </span>
    )
  }

  return (
    <CitySearchPicker
      value={city}
      onChange={setCity}
      compact
      placeholder="Cari wilayah"
      aria-label="Pilih wilayah studio"
    />
  )
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const brand = studioBrand(user)
  const { showDemo, showReal, viewMode, notice, dismissNotice, city } = useStudio()
  const trialDaysLeft = getTrialDaysRemaining(user?.trialStartedAt)
  const trialEndsLabel = formatTrialEndsAt(user?.trialStartedAt)
  const trialUrgent = trialDaysLeft > 0 && trialDaysLeft <= 3

  return (
    <div className="min-h-screen bg-background">
      <header className="studio-chrome sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 overflow-visible px-4 sm:gap-3">
          <Link href="/" className="font-display text-xl leading-none">
            Key Assistant
          </Link>
          <span className="hidden min-w-0 truncate text-sm text-muted-foreground lg:inline">
            {brand.name}
          </span>
          {user ? (
            <span
              className={cn(
                "hidden rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide sm:inline",
                trialUrgent
                  ? "bg-[oklch(0.94_0.05_55)] text-[oklch(0.42_0.1_45)]"
                  : "bg-accent text-primary"
              )}
              title={
                trialEndsLabel
                  ? `Trial ${TRIAL_DAYS} hari sampai ${trialEndsLabel}`
                  : `Trial ${TRIAL_DAYS} hari`
              }
            >
              {trialStatusLabel(user.trialStartedAt)}
            </span>
          ) : null}
          <div className="relative z-50 ml-auto flex items-center gap-2 pointer-events-auto">
            <CityPicker />
            <Link
              href={`/p/${studio.slug}`}
              className="hidden text-sm font-medium text-primary hover:underline sm:inline"
            >
              Pricelist
            </Link>
            <Button
              type="button"
              variant={viewMode === "demo" ? "default" : "outline"}
              size="sm"
              onClick={showDemo}
              aria-label="Data contoh"
              title="Lihat contoh studio yang sudah terisi"
            >
              <RotateCcw />
              <span className="hidden sm:inline">Data contoh</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "real" ? "default" : "outline"}
              size="sm"
              onClick={showReal}
              aria-label="Data saya"
              title="Kembali ke data real akun ini"
            >
              <UserRound />
              <span className="hidden sm:inline">Data saya</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void logout().then(() => router.replace("/masuk"))
              }}
            >
              <LogOut />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[180px_1fr]">
        <Suspense fallback={<div className="studio-chrome hidden md:block" />}>
          <SideNav />
        </Suspense>
        <div className="studio-main min-w-0 pb-20 md:pb-0">
          {user && trialDaysLeft > 0 && trialDaysLeft <= 3 ? (
            <div className="mb-4 rounded-xl bg-[oklch(0.96_0.04_55)] px-4 py-3 text-sm text-[oklch(0.38_0.08_45)] ring-1 ring-[oklch(0.85_0.06_55)]">
              Masa trial kamu tinggal {trialDaysLeft} hari
              {trialEndsLabel ? ` (sampai ${trialEndsLabel})` : null}. Hubungi kami sebelum
              akses studio dinonaktifkan.
            </div>
          ) : null}
          {viewMode === "demo" ? (
            <div className="mb-4 flex flex-col gap-2 rounded-xl bg-[oklch(0.96_0.03_75)] px-4 py-3 text-sm text-[oklch(0.4_0.08_55)] ring-1 ring-[oklch(0.88_0.05_55)] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mode <span className="font-semibold">data contoh</span> — hanya untuk melihat
                tampilan studio terisi. Data real tidak berubah.
              </p>
              <Button size="sm" variant="outline" className="bg-card" onClick={showReal}>
                Ke data saya
              </Button>
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
              <p>{notice}</p>
              <button className="font-medium" onClick={dismissNotice} type="button">
                Tutup
              </button>
            </div>
          ) : null}
          <p className="mb-4 text-xs text-muted-foreground md:hidden">
            Lokasi aktif: {city}. Partner dan inbox mengikuti kota ini.
            {user ? ` · ${trialStatusLabel(user.trialStartedAt)}.` : null}
          </p>
          {children}
        </div>
      </div>

      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
