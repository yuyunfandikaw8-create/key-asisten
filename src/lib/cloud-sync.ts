import type { AuthUser } from "@/lib/auth"
import { normalizeEmail } from "@/lib/auth"
import { supabase, supabaseConfigured } from "@/lib/supabase"
import type { StudioState } from "@/lib/types"

export type CloudOwnerPayload = {
  profile: Partial<AuthUser>
  studio: StudioState | null
  updatedAt?: string
}

function stripHeavy(profile: Partial<AuthUser>): Partial<AuthUser> {
  // Simpan field penting; potong base64 besar jika perlu agar upsert tidak gagal.
  const next = { ...profile }
  if (next.logoDataUrl && next.logoDataUrl.length > 400_000) {
    next.logoDataUrl = undefined
  }
  if (next.paymentSettings?.qrisDataUrl && next.paymentSettings.qrisDataUrl.length > 400_000) {
    next.paymentSettings = { ...next.paymentSettings, qrisDataUrl: undefined }
  }
  // Jangan simpan password.
  delete (next as { password?: string }).password
  return next
}

export function canCloudSync(email?: string | null) {
  if (!supabaseConfigured || !supabase) return false
  if (!email) return false
  const value = normalizeEmail(email)
  return !value.endsWith("@riasaja.id")
}

export async function pullOwnerCloud(ownerId: string): Promise<CloudOwnerPayload | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from("owner_data")
      .select("profile, studio, updated_at")
      .eq("owner_id", ownerId)
      .maybeSingle()
    if (error || !data) return null
    return {
      profile: (data.profile || {}) as Partial<AuthUser>,
      studio: (data.studio as StudioState | null) || null,
      updatedAt: typeof data.updated_at === "string" ? data.updated_at : undefined,
    }
  } catch {
    return null
  }
}

export async function pushOwnerProfile(user: AuthUser) {
  if (!supabase || !canCloudSync(user.email)) return false
  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    const ownerId = sessionUser?.id
    if (!ownerId) return false

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
    return !error
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

    // Ambil profil yang ada supaya tidak menimpa dengan kosong.
    const existing = await pullOwnerCloud(ownerId)
    const profile = stripHeavy({
      ...(existing?.profile || {}),
      id: ownerId,
      email: user.email,
      name: user.name || existing?.profile?.name,
      phone: user.phone || existing?.profile?.phone,
      city: user.city || studio.city || existing?.profile?.city,
      studioName: user.studioName || existing?.profile?.studioName,
      role: user.role,
      onboardingStep: user.onboardingStep ?? existing?.profile?.onboardingStep,
      businessFields: user.businessFields ?? existing?.profile?.businessFields,
      services: user.services ?? existing?.profile?.services,
      paymentSettings: user.paymentSettings ?? existing?.profile?.paymentSettings,
      subscription: user.subscription ?? existing?.profile?.subscription,
      trialStartedAt: user.trialStartedAt ?? existing?.profile?.trialStartedAt,
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
    return !error
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
