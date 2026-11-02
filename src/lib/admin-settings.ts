/**
 * Konfigurasi server Key Assistant (diatur dari menu /admin).
 * Disimpan lokal; sumber tunggal untuk harga paket & opsi langganan.
 */

export type AdminPayMethod = "qris" | "va" | "ewallet" | "transfer" | "card"

export const ADMIN_SETTINGS_KEY = "key-assistant.admin-settings.v2"
export const ADMIN_SETTINGS_LEGACY_KEYS = [
  "key-assistant.admin-settings.v1",
] as const

/** Detail resmi QRIS Key Assistant (gopay merchant). */
export const DEFAULT_QRIS_IMAGE = "/payments/qris-key-assistant.jpg"

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

export type AdminQrisDetails = {
  merchantName: string
  nmid: string
  terminalId: string
  printerId: string
  imageUrl: string
  instructions: string
}

export type AdminTransferDetails = {
  bankName: string
  accountNumber: string
  accountHolder: string
  instructions: string
}

export type AdminVaDetails = {
  bankName: string
  vaNumber: string
  instructions: string
}

export type AdminEwalletDetails = {
  provider: string
  accountNumber: string
  accountName: string
  instructions: string
}

export type AdminPaymentDetails = {
  qris: AdminQrisDetails
  transfer: AdminTransferDetails
  va: AdminVaDetails
  ewallet: AdminEwalletDetails
}

export type AdminSettings = {
  plan: AdminPlanConfig
  /** Metode pembayaran langganan yang ditawarkan ke Owner. */
  enabledPayMethods: AdminPayMethod[]
  paymentDetails: AdminPaymentDetails
  /** Pengumuman singkat di halaman /langganan. */
  serverNotice: string
  /** Catatan internal admin (tidak tampil ke Owner). */
  adminNotes: string
  /** Support contact untuk Owner. */
  supportWhatsapp: string
  supportEmail: string
  updatedAt?: string
}

export const DEFAULT_PAYMENT_DETAILS: AdminPaymentDetails = {
  qris: {
    merchantName: "KEY ASSISTANT",
    nmid: "ID1026629614458",
    terminalId: "A01",
    printerId: "93600914",
    imageUrl: DEFAULT_QRIS_IMAGE,
    instructions:
      "1) Buka aplikasi e-wallet atau m-banking yang mendukung QRIS.\n2) Scan kode QR Key Assistant.\n3) Pastikan nama merchant KEY ASSISTANT dan nominal sesuai paket.\n4) Bayar, lalu kembali ke halaman langganan dan tekan “Saya sudah bayar”.\n5) Tunggu verifikasi admin — status active hanya setelah dikonfirmasi.",
  },
  transfer: {
    bankName: "",
    accountNumber: "",
    accountHolder: "KEY ASSISTANT",
    instructions:
      "Transfer sesuai nominal paket, cantumkan email akun di berita transfer, lalu unggah/simpan bukti dan tekan “Saya sudah bayar”.",
  },
  va: {
    bankName: "",
    vaNumber: "",
    instructions:
      "Bayar lewat Virtual Account sesuai bank yang dipilih. Simpan bukti, lalu tekan “Saya sudah bayar”.",
  },
  ewallet: {
    provider: "GoPay / OVO / Dana",
    accountNumber: "",
    accountName: "KEY ASSISTANT",
    instructions:
      "Kirim nominal sesuai paket ke nomor e-wallet di atas, lalu tekan “Saya sudah bayar”.",
  },
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
  enabledPayMethods: ["qris", "transfer", "va", "ewallet"],
  paymentDetails: DEFAULT_PAYMENT_DETAILS,
  serverNotice:
    "Pembayaran langganan adalah Owner → Key Assistant (terpisah dari bayar jasa klien ke vendor).",
  adminNotes: "",
  supportWhatsapp: "",
  supportEmail: "",
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n =
    typeof value === "number" ? value : Number(String(value).replace(/\D/g, ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

function mergeQris(
  raw: Partial<AdminQrisDetails> | undefined
): AdminQrisDetails {
  return {
    merchantName:
      raw?.merchantName?.trim() || DEFAULT_PAYMENT_DETAILS.qris.merchantName,
    nmid: raw?.nmid?.trim() || DEFAULT_PAYMENT_DETAILS.qris.nmid,
    terminalId:
      raw?.terminalId?.trim() || DEFAULT_PAYMENT_DETAILS.qris.terminalId,
    printerId: raw?.printerId?.trim() || DEFAULT_PAYMENT_DETAILS.qris.printerId,
    imageUrl: raw?.imageUrl?.trim() || DEFAULT_PAYMENT_DETAILS.qris.imageUrl,
    instructions:
      raw?.instructions?.trim() || DEFAULT_PAYMENT_DETAILS.qris.instructions,
  }
}

function mergeTransfer(
  raw: Partial<AdminTransferDetails> | undefined
): AdminTransferDetails {
  return {
    bankName: raw?.bankName?.trim() || "",
    accountNumber: raw?.accountNumber?.trim() || "",
    accountHolder:
      raw?.accountHolder?.trim() ||
      DEFAULT_PAYMENT_DETAILS.transfer.accountHolder,
    instructions:
      raw?.instructions?.trim() ||
      DEFAULT_PAYMENT_DETAILS.transfer.instructions,
  }
}

function mergeVa(raw: Partial<AdminVaDetails> | undefined): AdminVaDetails {
  return {
    bankName: raw?.bankName?.trim() || "",
    vaNumber: raw?.vaNumber?.trim() || "",
    instructions:
      raw?.instructions?.trim() || DEFAULT_PAYMENT_DETAILS.va.instructions,
  }
}

function mergeEwallet(
  raw: Partial<AdminEwalletDetails> | undefined
): AdminEwalletDetails {
  return {
    provider:
      raw?.provider?.trim() || DEFAULT_PAYMENT_DETAILS.ewallet.provider,
    accountNumber: raw?.accountNumber?.trim() || "",
    accountName:
      raw?.accountName?.trim() || DEFAULT_PAYMENT_DETAILS.ewallet.accountName,
    instructions:
      raw?.instructions?.trim() ||
      DEFAULT_PAYMENT_DETAILS.ewallet.instructions,
  }
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
    paymentDetails: {
      qris: mergeQris(raw?.paymentDetails?.qris),
      transfer: mergeTransfer(raw?.paymentDetails?.transfer),
      va: mergeVa(raw?.paymentDetails?.va),
      ewallet: mergeEwallet(raw?.paymentDetails?.ewallet),
    },
    serverNotice:
      typeof raw?.serverNotice === "string"
        ? raw.serverNotice
        : DEFAULT_ADMIN_SETTINGS.serverNotice,
    adminNotes: typeof raw?.adminNotes === "string" ? raw.adminNotes : "",
    supportWhatsapp:
      typeof raw?.supportWhatsapp === "string" ? raw.supportWhatsapp : "",
    supportEmail: typeof raw?.supportEmail === "string" ? raw.supportEmail : "",
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : undefined,
  }
}

export function readAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY)
    if (raw) {
      return normalizeAdminSettings(JSON.parse(raw) as Partial<AdminSettings>)
    }
    for (const legacy of ADMIN_SETTINGS_LEGACY_KEYS) {
      const old = localStorage.getItem(legacy)
      if (!old) continue
      const merged = normalizeAdminSettings(
        JSON.parse(old) as Partial<AdminSettings>
      )
      writeAdminSettings(merged)
      localStorage.removeItem(legacy)
      return merged
    }
    return DEFAULT_ADMIN_SETTINGS
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

export function getLivePaymentDetails(): AdminPaymentDetails {
  return readAdminSettings().paymentDetails
}

export function getLiveSupportContact() {
  const settings = readAdminSettings()
  return {
    whatsapp: settings.supportWhatsapp.trim(),
    email: settings.supportEmail.trim(),
  }
}
