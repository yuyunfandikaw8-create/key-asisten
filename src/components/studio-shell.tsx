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
  RotateCcw,
  Shirt,
  Wallet,
} from "lucide-react"

import { studio } from "@/lib/catalog"
import { CITIES } from "@/lib/cities"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const links = [
  { href: "/studio", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/studio/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/studio/invoice", label: "Invoice", icon: FileText },
  { href: "/studio/inbox", label: "Inbox", icon: Inbox },
  { href: "/studio/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/studio/gaun", label: "Gaun", icon: Shirt },
  { href: "/studio/partner", label: "Partner", icon: Handshake },
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
  const { city, setCity } = useStudio()
  return (
    <Select value={city} onValueChange={(value) => value && setCity(value)}>
      <SelectTrigger className="h-8 w-[8.5rem] bg-card text-xs sm:w-40 sm:text-sm" size="sm">
        <SelectValue>{(value) => String(value ?? city)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CITIES.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const { reset, notice, dismissNotice, city } = useStudio()

  return (
    <div className="min-h-screen bg-background">
      <header className="studio-chrome sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3">
          <Link href="/" className="font-display text-xl leading-none">
            Riasaja
          </Link>
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {studio.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <CityPicker />
            <Link
              href={`/p/${studio.slug}`}
              className="hidden text-sm font-medium text-primary hover:underline sm:inline"
            >
              Pricelist
            </Link>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw />
              <span className="hidden sm:inline">Data contoh</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[180px_1fr]">
        <Suspense fallback={<div className="studio-chrome hidden md:block" />}>
          <SideNav />
        </Suspense>
        <div className="studio-main min-w-0 pb-20 md:pb-0">
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
