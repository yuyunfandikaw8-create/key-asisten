import {
  CalendarDays,
  FileText,
  Home,
  Plus,
  Settings,
  Users,
  Wallet,
  NotebookPen,
  Handshake,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Beranda", active: true },
  { icon: CalendarDays, label: "Jadwal" },
  { icon: Users, label: "Klien" },
  { icon: FileText, label: "Invoice" },
  { icon: Wallet, label: "Keuangan" },
  { icon: NotebookPen, label: "Catatan" },
  { icon: Handshake, label: "Vendor" },
  { icon: Settings, label: "Pengaturan" },
] as const

const scheduleRows = [
  {
    time: "09.00",
    title: "Makeup & Hairdo",
    client: "Rina · Wisuda",
    status: "Selesai",
    tone: "done",
  },
  {
    time: "13.00",
    title: "Trial Makeup",
    client: "Nadia · Wedding",
    status: "Proses",
    tone: "progress",
  },
  {
    time: "16.30",
    title: "Paket Adat",
    client: "Laras · Akad",
    status: "Menunggu",
    tone: "wait",
  },
] as const

const floatCards = [
  {
    title: "Jadwal",
    body: "Atur semua agenda dalam satu tempat.",
    accent: "bg-[oklch(0.55_0.14_25)]",
    className: "hero-float hero-float--a -left-1 top-2 sm:-left-4 sm:top-4",
  },
  {
    title: "Klien",
    body: "Kelola data klien dengan lebih mudah.",
    accent: "bg-[oklch(0.62_0.12_155)]",
    className: "hero-float hero-float--b right-0 top-0 sm:-right-2 sm:top-2",
  },
  {
    title: "Invoice",
    body: "Kirim invoice dan pantau pembayaran klien.",
    accent: "bg-[oklch(0.58_0.12_245)]",
    className: "hero-float hero-float--c bottom-16 left-2 sm:bottom-20 sm:left-0",
  },
  {
    title: "Keuangan",
    body: "Pantau pemasukan dan pengeluaran bisnis.",
    accent: "bg-[oklch(0.72_0.12_75)]",
    className: "hero-float hero-float--d -right-1 bottom-8 sm:-right-3 sm:bottom-10",
  },
] as const

function StatusPill({
  tone,
  children,
}: {
  tone: "done" | "progress" | "wait"
  children: string
}) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[8px] font-semibold tracking-wide uppercase",
        tone === "done" && "bg-[oklch(0.92_0.05_155)] text-[oklch(0.4_0.1_155)]",
        tone === "progress" && "bg-[oklch(0.93_0.04_75)] text-[oklch(0.45_0.1_55)]",
        tone === "wait" && "bg-[oklch(0.93_0.03_250)] text-[oklch(0.42_0.1_250)]"
      )}
    >
      {children}
    </span>
  )
}

function LaptopScreen() {
  return (
    <div className="flex h-full overflow-hidden rounded-[0.55rem] bg-[oklch(0.985_0.01_25)] text-[oklch(0.32_0.03_20)]">
      <aside className="hidden w-[28%] flex-col gap-1 border-r border-[oklch(0.9_0.02_20)] bg-[oklch(0.97_0.015_20)] p-1.5 sm:flex">
        <div className="mb-1 flex items-center gap-1 px-0.5">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="truncate text-[8px] font-semibold text-primary">Key Assistant</span>
        </div>
        {navItems.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-1 rounded-md px-1 py-1 text-[7px]",
              active ? "bg-primary text-primary-foreground" : "text-[oklch(0.45_0.03_20)]"
            )}
          >
            <Icon className="size-2.5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-1.5 sm:p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[8px] font-semibold sm:text-[9px]">
              Selamat datang. Mau hari yang produktif hari ini!
            </p>
            <p className="text-[7px] text-[oklch(0.5_0.02_20)]">Nadia Putri · Owner</p>
          </div>
          <div className="size-4 shrink-0 rounded-full bg-[oklch(0.9_0.04_20)] ring-1 ring-primary/20" />
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[
            ["Jadwal", "4 Agenda", "bg-[oklch(0.93_0.05_20)]"],
            ["Invoice", "3 Menunggu", "bg-[oklch(0.94_0.04_55)]"],
            ["Klien", "2 Baru", "bg-[oklch(0.93_0.03_245)]"],
            ["Keuangan", "Rp4,3jt", "bg-[oklch(0.93_0.04_155)]"],
          ].map(([label, value, tone]) => (
            <div key={label} className={cn("rounded-md px-1 py-1", tone)}>
              <p className="text-[6px] text-[oklch(0.48_0.03_20)]">{label}</p>
              <p className="truncate text-[7px] font-semibold sm:text-[8px]">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_0.9fr] gap-1">
          <div className="overflow-hidden rounded-md border border-[oklch(0.92_0.02_20)] bg-white p-1">
            <p className="mb-1 text-[7px] font-semibold">Jadwal Hari Ini</p>
            <div className="space-y-1">
              {scheduleRows.map((row) => (
                <div
                  key={row.time}
                  className="flex items-center gap-1 rounded bg-[oklch(0.975_0.01_20)] px-1 py-0.5"
                >
                  <span className="w-6 shrink-0 text-[7px] font-medium text-primary">
                    {row.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[7px] font-medium">{row.title}</p>
                    <p className="truncate text-[6px] text-[oklch(0.52_0.02_20)]">{row.client}</p>
                  </div>
                  <StatusPill tone={row.tone}>{row.status}</StatusPill>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[oklch(0.92_0.02_20)] bg-white p-1">
            <p className="mb-1 text-[7px] font-semibold">Oktober 2026</p>
            <div className="grid grid-cols-7 gap-px text-center text-[6px] text-[oklch(0.5_0.02_20)]">
              {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
                <span key={`${d}-${i}`} className="font-semibold text-primary/70">
                  {d}
                </span>
              ))}
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <span
                  key={day}
                  className={cn(
                    "rounded-sm py-0.5",
                    day === 21 && "bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-[oklch(0.985_0.01_25)] text-[oklch(0.32_0.03_20)]">
      <div className="mx-auto mt-1.5 h-1 w-8 rounded-full bg-[oklch(0.85_0.02_20)]" />
      <div className="px-2 pt-2">
        <p className="text-[8px] font-semibold leading-tight">Halo, Nadia!</p>
        <p className="text-[6px] text-[oklch(0.5_0.02_20)]">Semoga hari ini berjalan lancar</p>
      </div>
      <div className="mt-2 space-y-1 px-2">
        {scheduleRows.map((row) => (
          <div
            key={row.time}
            className="rounded-lg border border-[oklch(0.92_0.02_20)] bg-white px-1.5 py-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[7px] font-semibold text-primary">{row.time}</span>
              <StatusPill tone={row.tone}>{row.status}</StatusPill>
            </div>
            <p className="mt-0.5 truncate text-[7px] font-medium">{row.title}</p>
            <p className="truncate text-[6px] text-[oklch(0.52_0.02_20)]">{row.client}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between border-t border-[oklch(0.92_0.02_20)] bg-white px-2 py-1.5">
        <div className="flex flex-1 justify-around text-[oklch(0.55_0.03_20)]">
          <Home className="size-3 text-primary" aria-hidden />
          <CalendarDays className="size-3" aria-hidden />
          <Users className="size-3" aria-hidden />
          <Wallet className="size-3" aria-hidden />
        </div>
        <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Plus className="size-3" aria-hidden />
        </span>
      </div>
    </div>
  )
}

export function HeroAppIllustration() {
  return (
    <div
      className="hero-device-stage relative mx-auto w-full max-w-[34rem] px-2 pt-8 pb-4 sm:px-4 sm:pt-10"
      aria-label="Ilustrasi tampilan aplikasi Key Assistant di laptop dan ponsel"
    >
      {floatCards.map((card) => (
        <div
          key={card.title}
          className={cn(
            "absolute z-20 max-w-[9.5rem] rounded-2xl bg-card/95 px-3 py-2.5 shadow-[0_12px_28px_oklch(0.4_0.05_18_/0.14)] ring-1 ring-primary/10 backdrop-blur-sm sm:max-w-[10.5rem]",
            card.className
          )}
        >
          <div className="flex items-start gap-2">
            <span className={cn("mt-0.5 size-2.5 shrink-0 rounded-full", card.accent)} />
            <div>
              <p className="text-xs font-semibold text-primary">{card.title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                {card.body}
              </p>
            </div>
          </div>
        </div>
      ))}

      <div className="hero-laptop relative z-10 mx-auto w-[88%] sm:w-[90%]">
        <div className="rounded-t-[1rem] border border-b-0 border-[oklch(0.78_0.02_20)] bg-[oklch(0.82_0.015_20)] p-2 shadow-[0_28px_50px_oklch(0.4_0.05_18_/0.18)] sm:p-2.5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[0.65rem] bg-black/90 ring-1 ring-black/30">
            <div className="absolute inset-[3%] sm:inset-[2.5%]">
              <LaptopScreen />
            </div>
          </div>
        </div>
        <div className="relative h-2.5 rounded-b-[0.85rem] bg-[linear-gradient(180deg,oklch(0.78_0.015_20),oklch(0.7_0.02_20))] shadow-[0_10px_18px_oklch(0.4_0.04_20_/0.18)]">
          <div className="absolute inset-x-[18%] -top-0.5 h-1 rounded-b-full bg-[oklch(0.62_0.02_20)]" />
        </div>
        <div className="mx-auto h-1.5 w-[70%] rounded-b-xl bg-[oklch(0.75_0.015_20)]" />
      </div>

      <div className="hero-phone absolute bottom-6 left-1 z-30 w-[30%] max-w-[7.5rem] sm:bottom-8 sm:left-3 sm:w-[28%] sm:max-w-[8.25rem]">
        <div className="rounded-[1.15rem] border-[3px] border-[oklch(0.28_0.02_20)] bg-[oklch(0.22_0.02_20)] p-1 shadow-[0_18px_36px_oklch(0.35_0.05_20_/0.28)]">
          <div className="overflow-hidden rounded-[0.85rem] bg-white">
            <div className="aspect-[9/17]">
              <PhoneScreen />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
