"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarHeart,
  Check,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Receipt,
  Search,
  UserRound,
  X,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useClientWorkspace } from "@/components/client-provider"
import { cn } from "@/lib/utils"

const links = [
  { href: "/klien", label: "Beranda", icon: Home, exact: true },
  { href: "/klien/cari", label: "Cari Vendor", icon: Search },
  { href: "/klien/pilihan", label: "Pilihan Saya", icon: Heart },
  { href: "/klien/acara", label: "Acara Saya", icon: CalendarHeart },
  { href: "/klien/pesan", label: "Pesan", icon: MessageCircle },
  { href: "/klien/booking", label: "Booking Saya", icon: ClipboardList },
  { href: "/klien/tagihan", label: "Tagihan", icon: Receipt },
  { href: "/klien/profil", label: "Profil", icon: UserRound },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function DataModeSwitcher() {
  const { viewMode, showDemo, showReal } = useClientWorkspace()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const isDemo = viewMode === "demo"

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      {isDemo ? (
        <>
          <span className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
            Data Contoh
          </span>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Keluar dari data contoh"
            title="Kembali ke data acara saya"
            onClick={showReal}
          >
            <X className="size-3.5" />
          </button>
        </>
      ) : null}

      <div className="relative">
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-border/80 bg-[oklch(0.97_0.01_20)] px-3 text-xs font-semibold text-foreground sm:text-sm",
            open && "border-primary/35 ring-2 ring-primary/10"
          )}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Data Saya
          <ChevronDown className={cn("size-3.5 opacity-70 transition", open && "rotate-180")} />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute top-full right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-2xl border border-border/70 bg-card py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitemradio"
              aria-checked={!isDemo}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                !isDemo
                  ? "bg-[oklch(0.96_0.02_20)] font-medium"
                  : "hover:bg-[oklch(0.97_0.015_20)]"
              )}
              onClick={() => {
                showReal()
                setOpen(false)
              }}
            >
              <Check
                className={cn("size-4 shrink-0", !isDemo ? "text-primary" : "text-transparent")}
              />
              <span>Data acara saya</span>
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={isDemo}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                isDemo
                  ? "bg-[oklch(0.96_0.02_20)] font-medium"
                  : "hover:bg-[oklch(0.97_0.015_20)]"
              )}
              onClick={() => {
                showDemo()
                setOpen(false)
              }}
            >
              <FlaskConical className="size-4 shrink-0 text-primary" />
              <span>Coba data contoh</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { workspace, activeEvent, notice, dismissNotice, viewMode } = useClientWorkspace()
  const shortlistCount = workspace.shortlist.length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/klien" className="font-display text-xl leading-none">
            Key Assistant
          </Link>
          <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:inline">
            {user?.name}
          </span>
          {activeEvent ? (
            <span className="ml-auto hidden max-w-[12rem] truncate rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary lg:inline">
              {activeEvent.title}
            </span>
          ) : (
            <span className="ml-auto" />
          )}
          <DataModeSwitcher />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
            onClick={() => void logout().then(() => router.replace("/masuk"))}
          >
            <LogOut className="size-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[13rem_1fr]">
        <nav className="hidden md:flex md:flex-col md:gap-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(pathname, link.href, link.exact)
            const badge = link.href === "/klien/pilihan" ? shortlistCount : 0
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{link.label}</span>
                {badge > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] leading-5",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <main className="min-w-0 pb-24 md:pb-6">
          {notice ? (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
              <p>
                {notice}
                {viewMode === "demo" ? (
                  <span className="text-muted-foreground">
                    {" "}
                    Perubahan di data contoh tidak menimpa Data saya.
                  </span>
                ) : null}
              </p>
              <button
                className="shrink-0 font-medium"
                onClick={dismissNotice}
                type="button"
              >
                Tutup
              </button>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
        <div className="flex overflow-x-auto">
          {links.slice(0, 5).map((link) => {
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
                {link.label.split(" ")[0]}
                {link.href === "/klien/pilihan" && shortlistCount > 0 ? (
                  <span className="absolute top-1 right-2 size-1.5 rounded-full bg-primary" />
                ) : null}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
