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
  type LucideIcon,
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
    client: "Sinta · Wedding",
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

const featureIconStyle =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"

const floatCards: {
  title: string
  body: string
  icon: LucideIcon
  className: string
}[] = [
  {
    title: "Jadwal",
    body: "Atur semua agenda dalam satu tempat.",
    icon: CalendarDays,
    className: "hero-float hero-float--a left-0 top-0 lg:-left-2 lg:top-2",
  },
  {
    title: "Klien",
    body: "Kelola data klien dengan lebih mudah.",
    icon: Users,
    className: "hero-float hero-float--b right-0 top-1 lg:right-0 lg:top-0",
  },
  {
    title: "Invoice",
    body: "Kirim invoice dan pantau pembayaran klien.",
    icon: FileText,
    className: "hero-float hero-float--c left-[22%] bottom-1 z-30 lg:left-[24%] lg:bottom-0",
  },
  {
    title: "Keuangan",
    body: "Pantau pemasukan dan pengeluaran bisnis.",
    icon: Wallet,
    className: "hero-float hero-float--d right-0 bottom-10 lg:right-0 lg:bottom-8",
  },
]

const metricCards: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Jadwal", value: "4 Agenda", icon: CalendarDays },
  { label: "Invoice", value: "3 Menunggu", icon: FileText },
  { label: "Klien", value: "2 Baru", icon: Users },
  { label: "Keuangan", value: "Rp4,3jt", icon: Wallet },
]

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
              Selamat datang. Mulai hari yang produktif !
            </p>
            <p className="text-[7px] text-[oklch(0.5_0.02_20)]">Studio · Owner</p>
          </div>
          <div className="size-4 shrink-0 rounded-full bg-[oklch(0.9_0.04_20)] ring-1 ring-primary/20" />
        </div>

        <div className="grid grid-cols-4 gap-1">
          {metricCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-md bg-[oklch(0.96_0.02_20)] px-1 py-1"
            >
              <div className="mb-0.5 flex items-center gap-0.5">
                <span className="flex size-3 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-2" aria-hidden />
                </span>
                <p className="truncate text-[6px] text-[oklch(0.48_0.03_20)]">{label}</p>
              </div>
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
        <p className="text-[8px] font-semibold leading-tight">Selamat datang!</p>
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

function FeatureCard({
  title,
  body,
  icon: Icon,
  className,
}: {
  title: string
  body: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card/95 px-2.5 py-2 shadow-[0_12px_28px_oklch(0.4_0.05_18_/0.14)] ring-1 ring-primary/10 backdrop-blur-sm sm:px-3 sm:py-2.5",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <span className={featureIconStyle}>
          <Icon className="size-3.5" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-primary sm:text-xs">{title}</p>
          <p className="mt-0.5 text-[9px] leading-snug text-muted-foreground sm:text-[11px]">
            {body}
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeroAppIllustration() {
  return (
    <div
      className="hero-device-stage relative mx-auto w-full max-w-[36rem] px-1 pt-4 pb-2 sm:px-3 sm:pt-10 sm:pb-14"
      aria-label="Ilustrasi tampilan aplikasi Key Assistant di laptop dan ponsel"
    >
      {floatCards.map((card) => (
        <FeatureCard
          key={card.title}
          title={card.title}
          body={card.body}
          icon={card.icon}
          className={cn(
            "absolute z-20 hidden max-w-[10.5rem] sm:block",
            card.className
          )}
        />
      ))}

      <div className="relative pb-10 sm:pb-8">
        <div className="hero-laptop relative z-10 mx-auto w-[92%] sm:w-[90%]">
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

        <div className="hero-phone absolute -bottom-2 -left-1 z-30 w-[30%] max-w-[7rem] sm:bottom-1 sm:-left-3 sm:w-[26%] sm:max-w-[8.25rem]">
          <div className="rounded-[1.15rem] border-[3px] border-[oklch(0.28_0.02_20)] bg-[oklch(0.22_0.02_20)] p-1 shadow-[0_18px_36px_oklch(0.35_0.05_20_/0.28)]">
            <div className="overflow-hidden rounded-[0.85rem] bg-white">
              <div className="aspect-[9/17]">
                <PhoneScreen />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:hidden">
        {floatCards.map((card) => (
          <FeatureCard
            key={`mobile-${card.title}`}
            title={card.title}
            body={card.body}
            icon={card.icon}
          />
        ))}
      </div>
    </div>
  )
}
