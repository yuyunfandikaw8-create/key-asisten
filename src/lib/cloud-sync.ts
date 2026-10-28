import type { AuthUser } from "@/lib/auth"
import { normalizeEmail, normalizePaymentSettings, normalizeRole } from "@/lib/auth"
import {
  emptyClientWorkspace,
  type ClientWorkspace,
} from "@/lib/client-workspace"
import { normalizeOnboardingStep } from "@/lib/onboarding"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import type { StudioState } from "@/lib/types"

export type CloudPublicBookingProfile = {
  slug: string
  name: string
  phone: string
  city: string
  services: unknown[]
  updatedAt: string
}

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
    customBusinessFields: user.customBusinessFields,
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
    role_chosen: user.roleChosen !== false,
    trial_started_at: slim.trialStartedAt,
    onboarding_step: slim.onboardingStep,
    business_email: slim.businessEmail,
    instagram: slim.instagram,
    address: slim.address,
    business_fields: slim.businessFields,
    custom_business_fields: slim.customBusinessFields,
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
    customBusinessFields: Array.isArray(metadata.custom_business_fields)
      ? (metadata.custom_business_fields as AuthUser["customBusinessFields"])
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
    value.includes("client_data") ||
    value.includes("public_booking_profiles") ||
    value.includes("profiles") ||
    value.includes("booking_requests") ||
    value.includes("pgrst205") ||
    value.includes("schema cache") ||
    value.includes("does not exist") ||
    value.includes("could not find the table")
  )
}

export type CloudTableStatus = {
  configured: boolean
  tables: Record<
    "profiles" | "owner_data" | "client_data" | "public_booking_profiles" | "booking_requests",
    "ok" | "missing" | "error" | "skipped"
  >
}

/** Cek cepat apakah skema SQL sudah dijalankan di project Supabase. */
export async function checkCloudSchema(): Promise<CloudTableStatus> {
  const tables = {
    profiles: "skipped",
    owner_data: "skipped",
    client_data: "skipped",
    public_booking_profiles: "skipped",
    booking_requests: "skipped",
  } as CloudTableStatus["tables"]

  if (!supabaseConfigured || !supabase) {
    return { configured: false, tables }
  }

  for (const name of Object.keys(tables) as (keyof typeof tables)[]) {
    try {
      const { error } = await supabase.from(name).select("*").limit(1)
      if (!error) {
        tables[name] = "ok"
      } else if (isMissingTableError(error.message)) {
        tables[name] = "missing"
      } else {
        // RLS tanpa sesi sering 401/空 — tabel sudah ada.
        tables[name] = "ok"
      }
    } catch {
      tables[name] = "error"
    }
  }

  return { configured: true, tables }
}

export async function upsertProfileRow(user: AuthUser) {
  if (!supabase || !canCloudSync(user.email)) return false
  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    const id = sessionUser?.id
    if (!id) return false
    const { error } = await supabase.from("profiles").upsert(
      {
        id,
        email: normalizeEmail(user.email),
        name: user.name || "",
        phone: user.phone || "",
        city: user.city || "",
        role: normalizeRole(user.role),
        role_chosen: user.roleChosen !== false,
        avatar: user.avatar || null,
        trial_started_at: user.trialStartedAt || null,
        onboarding_step:
          user.onboardingStep === undefined || user.onboardingStep === null
            ? null
            : String(user.onboardingStep),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    if (error && !isMissingTableError(error.message)) return false
    return true
  } catch {
    return false
  }
}

function normalizeClientWorkspace(raw: unknown): ClientWorkspace {
  if (!raw || typeof raw !== "object") return emptyClientWorkspace()
  const value = raw as Partial<ClientWorkspace>
  return {
    shortlist: Array.isArray(value.shortlist) ? value.shortlist.map(String) : [],
    events: Array.isArray(value.events) ? (value.events as ClientWorkspace["events"]) : [],
    activeEventId:
      typeof value.activeEventId === "string" ? value.activeEventId : null,
  }
}

export async function pullClientCloud(
  clientId: string
): Promise<ClientWorkspace | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from("client_data")
      .select("workspace")
      .eq("client_id", clientId)
      .maybeSingle()
    if (error || !data) return null
    return normalizeClientWorkspace(data.workspace)
  } catch {
    return null
  }
}

export async function pushClientCloud(user: AuthUser, workspace: ClientWorkspace) {
  if (!supabase || !canCloudSync(user.email)) return false
  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    const clientId = sessionUser?.id
    if (!clientId) return false
    void upsertProfileRow(user)
    const { error } = await supabase.from("client_data").upsert(
      {
        client_id: clientId,
        email: normalizeEmail(user.email),
        workspace,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    if (error && !isMissingTableError(error.message)) return false
    return !error
  } catch {
    return false
  }
}

export async function pullPublicBookingProfileCloud(
  slug: string
): Promise<CloudPublicBookingProfile | null> {
  if (!supabase) return null
  const key = slug.trim().toLowerCase()
  if (!key) return null
  try {
    const { data, error } = await supabase
      .from("public_booking_profiles")
      .select("slug, name, phone, city, services, updated_at")
      .eq("slug", key)
      .maybeSingle()
    if (error || !data) return null
    return {
      slug: key,
      name: typeof data.name === "string" ? data.name : "",
      phone: typeof data.phone === "string" ? data.phone : "",
      city: typeof data.city === "string" ? data.city : "",
      services: Array.isArray(data.services) ? data.services : [],
      updatedAt:
        typeof data.updated_at === "string"
          ? data.updated_at
          : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function pushPublicBookingProfileCloud(
  ownerId: string,
  profile: CloudPublicBookingProfile
) {
  if (!supabase) return false
  try {
    const { error } = await supabase.from("public_booking_profiles").upsert(
      {
        slug: profile.slug,
        owner_id: ownerId,
        name: profile.name,
        phone: profile.phone,
        city: profile.city,
        services: profile.services,
        updated_at: profile.updatedAt || new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    if (error && !isMissingTableError(error.message)) return false
    return !error
  } catch {
    return false
  }
}

export async function pushBookingRequestCloud(input: {
  ownerId: string
  slug: string
  payload: Record<string, unknown>
}) {
  if (!supabase) return false
  try {
    const { error } = await supabase.from("booking_requests").insert({
      owner_id: input.ownerId,
      slug: input.slug,
      payload: input.payload,
      status: "diajukan",
    })
    if (error && !isMissingTableError(error.message)) return false
    return !error
  } catch {
    return false
  }
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
      customBusinessFields: user.customBusinessFields,
      services: user.services,
      paymentSettings: user.paymentSettings,
      subscription: user.subscription,
    })

    void upsertProfileRow(user)

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
        customBusinessFields: user.customBusinessFields,
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
    customBusinessFields: base.customBusinessFields?.length
      ? base.customBusinessFields
      : cloud.customBusinessFields,
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
