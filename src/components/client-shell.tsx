"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarHeart,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Receipt,
  Search,
  UserRound,
  ClipboardList,
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

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { workspace, activeEvent } = useClientWorkspace()
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
            <span className="ml-auto hidden max-w-[14rem] truncate rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:inline">
              {activeEvent.title}
            </span>
          ) : (
            <span className="ml-auto" />
          )}
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

        <main className="min-w-0 pb-24 md:pb-6">{children}</main>
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
