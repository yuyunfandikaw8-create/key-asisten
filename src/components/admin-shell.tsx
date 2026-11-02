"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/admin/paket", label: "Paket & Harga", icon: Package },
  { href: "/admin/metode-bayar", label: "Metode Bayar", icon: QrCode },
  { href: "/admin/pembayaran", label: "Verifikasi", icon: CreditCard },
  { href: "/admin/akun", label: "Akun", icon: Users },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/admin" className="font-display text-xl leading-none">
            Key Assistant
          </Link>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
            Server Admin
          </span>
          <span className="ml-auto truncate text-sm text-muted-foreground">
            {user?.email}
          </span>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={() => {
              void logout().then(() => router.replace("/masuk"))
            }}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
        <nav className="hidden md:grid h-fit gap-1 rounded-2xl bg-card p-2 ring-1 ring-foreground/10">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="min-w-0 pb-20 md:pb-0">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 px-1 py-2">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                {link.label.split(" ")[0]}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
