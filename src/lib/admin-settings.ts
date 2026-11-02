/**
 * Konfigurasi server Key Assistant (diatur dari menu /admin).
 * Disimpan lokal; sumber tunggal untuk harga paket & opsi langganan.
 */

export type AdminPayMethod = "qris" | "va" | "ewallet" | "transfer" | "card"

export const ADMIN_SETTINGS_KEY = "key-assistant.admin-settings.v1"

export type AdminPlanConfig = {
  id: string
  name: string
  trialDays: number
  isActive: boolean
  priceMonthly: number | null
  priceYearly: number | null
  blurbMonthly: string
  blurbYearly: string
  featureConfig: {
    readAfterExpiry: boolean
    writeRequiresActiveOrTrial: boolean
  }
}

export type AdminSettings = {
  plan: AdminPlanConfig
  /** Metode pembayaran langganan yang ditawarkan ke Owner. */
  enabledPayMethods: AdminPayMethod[]
  /** Pengumuman singkat di halaman /langganan. */
  serverNotice: string
  updatedAt?: string
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  plan: {
    id: "key-assistant",
    name: "Key Assistant",
    trialDays: 14,
    isActive: true,
    priceMonthly: null,
    priceYearly: null,
    blurbMonthly: "Fleksibel per bulan untuk mengelola bisnis di Key Assistant.",
    blurbYearly: "Bayar tahunan — hemat dibanding 12× bulanan.",
    featureConfig: {
      readAfterExpiry: true,
      writeRequiresActiveOrTrial: true,
    },
  },
  enabledPayMethods: ["qris", "va", "ewallet", "transfer"],
  serverNotice: "",
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "number" ? value : Number(String(value).replace(/\D/g, ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

export function normalizeAdminSettings(
  raw: Partial<AdminSettings> | null | undefined
): AdminSettings {
  const plan = raw?.plan
  const methods = Array.isArray(raw?.enabledPayMethods)
    ? raw!.enabledPayMethods.filter((id): id is AdminPayMethod =>
        ["qris", "va", "ewallet", "transfer", "card"].includes(id)
      )
    : [...DEFAULT_ADMIN_SETTINGS.enabledPayMethods]

  return {
    plan: {
      id: plan?.id?.trim() || DEFAULT_ADMIN_SETTINGS.plan.id,
      name: plan?.name?.trim() || DEFAULT_ADMIN_SETTINGS.plan.name,
      trialDays:
        typeof plan?.trialDays === "number" && plan.trialDays > 0
          ? Math.min(90, Math.round(plan.trialDays))
          : DEFAULT_ADMIN_SETTINGS.plan.trialDays,
      isActive: plan?.isActive !== false,
      priceMonthly: asNumberOrNull(plan?.priceMonthly),
      priceYearly: asNumberOrNull(plan?.priceYearly),
      blurbMonthly:
        plan?.blurbMonthly?.trim() || DEFAULT_ADMIN_SETTINGS.plan.blurbMonthly,
      blurbYearly:
        plan?.blurbYearly?.trim() || DEFAULT_ADMIN_SETTINGS.plan.blurbYearly,
      featureConfig: {
        readAfterExpiry: plan?.featureConfig?.readAfterExpiry !== false,
        writeRequiresActiveOrTrial:
          plan?.featureConfig?.writeRequiresActiveOrTrial !== false,
      },
    },
    enabledPayMethods: methods.length
      ? methods
      : [...DEFAULT_ADMIN_SETTINGS.enabledPayMethods],
    serverNotice: typeof raw?.serverNotice === "string" ? raw.serverNotice : "",
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : undefined,
  }
}

export function readAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY)
    if (!raw) return DEFAULT_ADMIN_SETTINGS
    return normalizeAdminSettings(JSON.parse(raw) as Partial<AdminSettings>)
  } catch {
    return DEFAULT_ADMIN_SETTINGS
  }
}

export function writeAdminSettings(next: AdminSettings) {
  const normalized = normalizeAdminSettings({
    ...next,
    updatedAt: new Date().toISOString(),
  })
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(normalized))
  }
  return normalized
}

export function getLiveMainPlan(): AdminPlanConfig {
  return readAdminSettings().plan
}

export function getLiveServerNotice() {
  return readAdminSettings().serverNotice.trim()
}

export function getLiveEnabledPayMethods(): AdminPayMethod[] {
  return readAdminSettings().enabledPayMethods
}
