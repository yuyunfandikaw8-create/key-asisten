"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import {
  CalendarDays,
  FileText,
  Handshake,
  LayoutDashboard,
  RotateCcw,
  Shirt,
  Wallet,
} from "lucide-react"

import { studio } from "@/lib/catalog"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/studio", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/studio/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/studio/invoice", label: "Invoice", icon: FileText },
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
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="studio-chrome fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
      <div className="grid grid-cols-6">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(pathname, link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 text-[11px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const { reset, notice, dismissNotice } = useStudio()

  return (
    <div className="min-h-screen bg-background">
      <header className="studio-chrome sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="font-display text-xl leading-none">
            Riasaja
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {studio.name} · {studio.city}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/p/${studio.slug}`}
              className="text-sm font-medium text-primary hover:underline"
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
          {children}
        </div>
      </div>

      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
