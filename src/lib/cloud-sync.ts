import type { AuthUser } from "@/lib/auth"
import { normalizeEmail, normalizePaymentSettings, normalizeRole } from "@/lib/auth"
import { normalizeOnboardingStep } from "@/lib/onboarding"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import type { StudioState } from "@/lib/types"

/** Metadata keys — ikut akun Auth Supabase, tidak perlu tabel ekstra. */
export const META_STUDIO_KEY = "ka_studio"
export const META_SYNC_AT = "ka_synced_at"

const META_STUDIO_MAX = 90_000

export type CloudOwnerPayload = {
  profile: Partial<AuthUser>
  studio: StudioState | null
  updatedAt?: string
}

function stripHeavy(profile: Partial<AuthUser>): Partial<AuthUser> {
  const next = { ...profile }
  if (next.logoDataUrl && next.logoDataUrl.length > 80_000) {
    next.logoDataUrl = undefined
  }
  if (next.paymentSettings?.qrisDataUrl && next.paymentSettings.qrisDataUrl.length > 80_000) {
    next.paymentSettings = { ...next.paymentSettings, qrisDataUrl: undefined }
  }
  delete (next as { password?: string }).password
  return next
}

export function canCloudSync(email?: string | null) {
  if (!supabaseConfigured || !supabase) return false
  if (!email) return false
  const value = normalizeEmail(email)
  return !value.endsWith("@riasaja.id")
}

/** Payload user_metadata yang dibaca di perangkat lain setelah login. */
export function profileToAuthMetadata(
  user: AuthUser,
  studio?: StudioState | null
): Record<string, unknown> {
  const slim = stripHeavy({
    name: user.name,
    phone: user.phone,
    city: user.city,
    studioName: user.studioName,
    role: user.role,
    trialStartedAt: user.trialStartedAt,
    onboardingStep: user.onboardingStep,
    businessEmail: user.businessEmail,
    instagram: user.instagram,
    address: user.address,
    logoDataUrl: user.logoDataUrl,
    businessFields: user.businessFields,
    services: user.services,
    paymentSettings: user.paymentSettings
      ? { ...user.paymentSettings, qrisDataUrl: undefined }
      : undefined,
    subscription: user.subscription,
  })

  const meta: Record<string, unknown> = {
    name: slim.name,
    phone: slim.phone,
    city: slim.city,
    studio_name: slim.studioName,
    role: slim.role,
    trial_started_at: slim.trialStartedAt,
    onboarding_step: slim.onboardingStep,
    business_email: slim.businessEmail,
    instagram: slim.instagram,
    address: slim.address,
    business_fields: slim.businessFields,
    services: slim.services,
    payment_settings: slim.paymentSettings,
    subscription: slim.subscription,
    [META_SYNC_AT]: new Date().toISOString(),
  }

  if (slim.logoDataUrl && slim.logoDataUrl.length < 60_000) {
    meta.logo_data_url = slim.logoDataUrl
  }

  if (studio) {
    const encoded = JSON.stringify(studio)
    if (encoded.length <= META_STUDIO_MAX) {
      meta[META_STUDIO_KEY] = studio
    }
  }

  return meta
}

export function profileFromAuthMetadata(
  metadata: Record<string, unknown> | undefined | null
): Partial<AuthUser> {
  if (!metadata) return {}
  const payment =
    metadata.payment_settings && typeof metadata.payment_settings === "object"
      ? normalizePaymentSettings(metadata.payment_settings as AuthUser["paymentSettings"])
      : undefined
  return {
    name: typeof metadata.name === "string" ? metadata.name : undefined,
    phone: typeof metadata.phone === "string" ? metadata.phone : undefined,
    city: typeof metadata.city === "string" ? metadata.city : undefined,
    studioName:
      (typeof metadata.studio_name === "string" && metadata.studio_name) ||
      (typeof metadata.studioName === "string" && metadata.studioName) ||
      undefined,
    role: metadata.role != null ? normalizeRole(metadata.role) : undefined,
    trialStartedAt:
      typeof metadata.trial_started_at === "string"
        ? metadata.trial_started_at
        : undefined,
    onboardingStep: normalizeOnboardingStep(metadata.onboarding_step),
    businessEmail:
      typeof metadata.business_email === "string" ? metadata.business_email : undefined,
    instagram: typeof metadata.instagram === "string" ? metadata.instagram : undefined,
    address: typeof metadata.address === "string" ? metadata.address : undefined,
    logoDataUrl:
      typeof metadata.logo_data_url === "string" ? metadata.logo_data_url : undefined,
    businessFields: Array.isArray(metadata.business_fields)
      ? (metadata.business_fields as AuthUser["businessFields"])
      : undefined,
    services: Array.isArray(metadata.services)
      ? (metadata.services as AuthUser["services"])
      : undefined,
    paymentSettings: payment,
    subscription:
      metadata.subscription && typeof metadata.subscription === "object"
        ? (metadata.subscription as AuthUser["subscription"])
        : undefined,
  }
}

export function studioFromAuthMetadata(
  metadata: Record<string, unknown> | undefined | null
): StudioState | null {
  if (!metadata) return null
  const raw = metadata[META_STUDIO_KEY]
  if (!raw || typeof raw !== "object") return null
  const studio = raw as StudioState
  if (!Array.isArray(studio.bookings) || !Array.isArray(studio.expenses)) return null
  return studio
}

function isMissingTableError(message?: string | null) {
  const value = (message || "").toLowerCase()
  return (
    value.includes("owner_data") ||
    value.includes("pgrst205") ||
    value.includes("schema cache") ||
    value.includes("does not exist")
  )
}

export async function pullOwnerCloud(ownerId: string): Promise<CloudOwnerPayload | null> {
  if (!supabase) return null

  let fromMeta: CloudOwnerPayload | null = null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id === ownerId) {
      const meta = (user.user_metadata || {}) as Record<string, unknown>
      const profile = profileFromAuthMetadata(meta)
      const studio = studioFromAuthMetadata(meta)
      const hasProfile = Boolean(
        profile.name ||
          profile.studioName ||
          profile.onboardingStep === "done" ||
          profile.services?.length ||
          profile.businessFields?.length
      )
      if (hasProfile || studio) {
        fromMeta = {
          profile,
          studio,
          updatedAt:
            typeof meta[META_SYNC_AT] === "string" ? (meta[META_SYNC_AT] as string) : undefined,
        }
      }
    }
  } catch {
    // lanjut coba tabel
  }

  try {
    const { data, error } = await supabase
      .from("owner_data")
      .select("profile, studio, updated_at")
      .eq("owner_id", ownerId)
      .maybeSingle()
    if (!error && data) {
      const fromTable: CloudOwnerPayload = {
        profile: (data.profile || {}) as Partial<AuthUser>,
        studio: (data.studio as StudioState | null) || null,
        updatedAt: typeof data.updated_at === "string" ? data.updated_at : undefined,
      }
      // Gabungkan: tabel menang untuk field terisi, metadata mengisi sisa.
      return {
        profile: { ...fromMeta?.profile, ...fromTable.profile },
        studio: studioHasRows(fromTable.studio)
          ? fromTable.studio
          : fromMeta?.studio || fromTable.studio,
        updatedAt: fromTable.updatedAt || fromMeta?.updatedAt,
      }
    }
    if (error && !isMissingTableError(error.message)) {
      // tabel ada tapi gagal — tetap pakai metadata
    }
  } catch {
    // abaikan
  }

  return fromMeta
}

/** Parse cloud payload langsung dari objek user hasil login/signup (tanpa fetch ekstra). */
export function cloudFromSessionUser(sessionUser: {
  id: string
  user_metadata?: Record<string, unknown>
}): CloudOwnerPayload | null {
  const meta = (sessionUser.user_metadata || {}) as Record<string, unknown>
  const profile = profileFromAuthMetadata(meta)
  const studio = studioFromAuthMetadata(meta)
  const hasProfile = Boolean(
    profile.name ||
      profile.studioName ||
      profile.onboardingStep === "done" ||
      profile.services?.length ||
      profile.businessFields?.length
  )
  if (!hasProfile && !studio) return null
  return {
    profile,
    studio,
    updatedAt: typeof meta[META_SYNC_AT] === "string" ? (meta[META_SYNC_AT] as string) : undefined,
  }
}

export async function pushOwnerProfile(user: AuthUser, studio?: StudioState | null) {
  if (!supabase || !canCloudSync(user.email)) return false
  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    const ownerId = sessionUser?.id
    if (!ownerId) return false

    // Utama: Auth metadata — langsung tersedia di HP lain setelah login.
    const existingStudio =
      studio ?? studioFromAuthMetadata((sessionUser.user_metadata || {}) as Record<string, unknown>)
    const { error: metaError } = await supabase.auth.updateUser({
      data: profileToAuthMetadata(user, existingStudio),
    })
    if (metaError) {
      // Tetap coba tabel di bawah.
    }

    const profile = stripHeavy({
      id: ownerId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      studioName: user.studioName,
      provider: user.provider,
      role: user.role,
      avatar: user.avatar,
      trialStartedAt: user.trialStartedAt,
      onboardingStep: user.onboardingStep,
      businessEmail: user.businessEmail,
      instagram: user.instagram,
      address: user.address,
      logoDataUrl: user.logoDataUrl,
      businessFields: user.businessFields,
      services: user.services,
      paymentSettings: user.paymentSettings,
      subscription: user.subscription,
    })

    const { error } = await supabase.from("owner_data").upsert(
      {
        owner_id: ownerId,
        email: normalizeEmail(user.email),
        profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" }
    )
    if (error && !isMissingTableError(error.message)) {
      return !metaError
    }
    return !metaError
  } catch {
    return false
  }
}

export async function pushStudioCloud(user: AuthUser, studio: StudioState) {
  if (!supabase || !canCloudSync(user.email)) return false
  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    const ownerId = sessionUser?.id
    if (!ownerId) return false

    const existingMeta = (sessionUser.user_metadata || {}) as Record<string, unknown>
    const existingProfile = applyCloudProfile(
      {
        id: ownerId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        city: user.city,
        studioName: user.studioName,
        provider: user.provider,
        role: user.role,
        trialStartedAt: user.trialStartedAt,
        onboardingStep: user.onboardingStep,
        businessFields: user.businessFields,
        services: user.services,
        paymentSettings: user.paymentSettings,
        subscription: user.subscription,
        businessEmail: user.businessEmail,
        instagram: user.instagram,
        address: user.address,
        logoDataUrl: user.logoDataUrl,
        avatar: user.avatar,
      },
      profileFromAuthMetadata(existingMeta)
    )

    const { error: metaError } = await supabase.auth.updateUser({
      data: profileToAuthMetadata(existingProfile, studio),
    })

    const profile = stripHeavy({
      ...existingProfile,
      id: ownerId,
      email: user.email,
    })

    const { error } = await supabase.from("owner_data").upsert(
      {
        owner_id: ownerId,
        email: normalizeEmail(user.email),
        profile,
        studio,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" }
    )
    if (error && !isMissingTableError(error.message)) {
      return !metaError
    }
    return !metaError
  } catch {
    return false
  }
}

/**
 * Gabungkan profil cloud ke user sesi.
 * Sesi/lokal menang jika sudah terisi; cloud hanya mengisi field kosong
 * (perangkat baru setelah login email yang sama).
 */
export function applyCloudProfile(base: AuthUser, cloud: Partial<AuthUser> | null | undefined): AuthUser {
  if (!cloud) return base
  const cloudStep = cloud.onboardingStep
  const baseStep = base.onboardingStep
  const onboardingStep =
    baseStep === "done" || cloudStep === "done"
      ? "done"
      : baseStep ?? cloudStep
  return {
    ...base,
    name: base.name || cloud.name || "",
    phone: base.phone || cloud.phone || "",
    city: base.city || cloud.city || "",
    studioName: base.studioName || cloud.studioName || "",
    role: base.role || cloud.role || "owner",
    avatar: base.avatar || cloud.avatar,
    trialStartedAt: base.trialStartedAt || cloud.trialStartedAt,
    onboardingStep,
    businessEmail: base.businessEmail || cloud.businessEmail,
    instagram: base.instagram || cloud.instagram,
    address: base.address || cloud.address,
    logoDataUrl: base.logoDataUrl || cloud.logoDataUrl,
    businessFields: base.businessFields?.length
      ? base.businessFields
      : cloud.businessFields,
    services: base.services?.length ? base.services : cloud.services,
    paymentSettings: base.paymentSettings || cloud.paymentSettings,
    subscription: base.subscription || cloud.subscription,
  }
}

export function studioHasRows(state: StudioState | null | undefined) {
  if (!state) return false
  return (
    state.bookings.length > 0 ||
    state.expenses.length > 0 ||
    state.partnerships.length > 0 ||
    state.combos.length > 0 ||
    state.messages.length > 0
  )
}

export function profileLooksComplete(profile: Partial<AuthUser> | null | undefined) {
  if (!profile) return false
  return (
    profile.onboardingStep === "done" ||
    Boolean(profile.studioName) ||
    Boolean(profile.services?.length) ||
    Boolean(profile.businessFields?.length)
  )
}
