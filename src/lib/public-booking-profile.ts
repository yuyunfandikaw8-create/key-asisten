import type { AuthUser } from "@/lib/auth"
import { packages } from "@/lib/catalog"
import {
  canCloudSync,
  pullPublicBookingProfileCloud,
  pushPublicBookingProfileCloud,
} from "@/lib/cloud-sync"
import type { BusinessService } from "@/lib/onboarding"
import { studioBrand } from "@/lib/studio-brand"
import { supabase } from "@/lib/supabase"

export const PUBLIC_BOOKING_PROFILE_KEY = "key-assistant.public-booking-profile.v1"

export type PublicBookingService = {
  id: string
  name: string
  price: number
  durationHours: number
  fieldId: BusinessService["fieldId"]
  blurb?: string
}

/** Contoh layanan + harga untuk mode Data contoh (isi form booking klien). */
export const DEMO_BOOKING_SERVICES: BusinessService[] = packages.map((item) => ({
  id: `demo-${item.id}`,
  fieldId: "makeup",
  name: item.name,
  price: item.price,
  durationHours:
    item.id === "wisuda" ? 3 : item.id === "perak" ? 4 : item.id === "adat" ? 10 : 8,
  details: item.blurb,
}))

const DEMO_BLURBS: Record<string, string> = Object.fromEntries(
  packages.map((item) => [`demo-${item.id}`, item.blurb])
)

export type PublicBookingProfile = {
  slug: string
  name: string
  phone: string
  city: string
  services: PublicBookingService[]
  updatedAt: string
}

type ProfileMap = Record<string, PublicBookingProfile>

function normalizeService(service: BusinessService): PublicBookingService | null {
  const name = service.name?.trim()
  const price = Number(service.price)
  if (!name || !Number.isFinite(price) || price <= 0) return null
  const blurb =
    service.details?.trim() || DEMO_BLURBS[service.id] || undefined
  return {
    id: service.id,
    name,
    price,
    durationHours: Number(service.durationHours) || 0,
    fieldId: service.fieldId,
    ...(blurb ? { blurb } : {}),
  }
}

function coerceCloudServices(raw: unknown[]): PublicBookingService[] {
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const service = item as Partial<PublicBookingService>
      return normalizeService({
        id: String(service.id || ""),
        name: String(service.name || ""),
        price: Number(service.price),
        durationHours: Number(service.durationHours) || 0,
        fieldId: (service.fieldId as BusinessService["fieldId"]) || "other",
        details: service.blurb,
      })
    })
    .filter((service): service is PublicBookingService => Boolean(service))
}

function readMap(): ProfileMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PUBLIC_BOOKING_PROFILE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ProfileMap
    if (!parsed || typeof parsed !== "object") return {}
    return parsed
  } catch {
    return {}
  }
}

function writeMap(map: ProfileMap) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PUBLIC_BOOKING_PROFILE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

export function readPublicBookingProfile(slug: string): PublicBookingProfile | null {
  const key = slug.trim().toLowerCase()
  if (!key) return null
  const profile = readMap()[key]
  if (!profile || !Array.isArray(profile.services)) return null
  return {
    ...profile,
    slug: key,
    services: profile.services
      .map((service) =>
        normalizeService({
          id: service.id,
          name: service.name,
          price: service.price,
          durationHours: service.durationHours ?? 0,
          fieldId: service.fieldId,
          details: service.blurb,
        })
      )
      .filter((service): service is PublicBookingService => Boolean(service)),
  }
}

/** Lokal dulu, lalu cloud — untuk /p/[slug] lintas perangkat. */
export async function loadPublicBookingProfile(
  slug: string
): Promise<PublicBookingProfile | null> {
  const local = readPublicBookingProfile(slug)
  const cloud = await pullPublicBookingProfileCloud(slug)
  if (!cloud) return local
  const fromCloud: PublicBookingProfile = {
    slug: cloud.slug,
    name: cloud.name,
    phone: cloud.phone,
    city: cloud.city,
    services: coerceCloudServices(cloud.services),
    updatedAt: cloud.updatedAt,
  }
  const map = readMap()
  map[fromCloud.slug] = fromCloud
  writeMap(map)
  if (!local) return fromCloud
  return Date.parse(fromCloud.updatedAt) >= Date.parse(local.updatedAt)
    ? fromCloud
    : local
}

/** Simpan snapshot layanan + identitas owner agar halaman /p/[slug] tidak pakai katalog. */
export function publishPublicBookingProfile(input: {
  slug: string
  name: string
  phone: string
  city?: string
  services: BusinessService[] | undefined | null
  ownerId?: string
}): PublicBookingProfile {
  const slug = input.slug.trim().toLowerCase()
  const services = (input.services ?? [])
    .map(normalizeService)
    .filter((service): service is PublicBookingService => Boolean(service))

  const profile: PublicBookingProfile = {
    slug,
    name: input.name.trim() || "Studio",
    phone: input.phone.trim(),
    city: input.city?.trim() || "",
    services,
    updatedAt: new Date().toISOString(),
  }

  const map = readMap()
  map[slug] = profile
  writeMap(map)

  if (input.ownerId) {
    void pushPublicBookingProfileCloud(input.ownerId, profile)
  } else if (supabase) {
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id
      if (id) void pushPublicBookingProfileCloud(id, profile)
    })
  }

  return profile
}

/** Publish dari akun login (halaman Link booking / editor layanan). */
export function publishFromOwner(
  user: AuthUser | null | undefined,
  options?: { demo?: boolean }
) {
  const brand = studioBrand(user, { demo: options?.demo })
  return publishPublicBookingProfile({
    slug: brand.slug,
    name: brand.name,
    phone: brand.phone,
    city: brand.city,
    services: options?.demo ? DEMO_BOOKING_SERVICES : user?.services,
    ownerId: user && canCloudSync(user.email) ? user.id : undefined,
  })
}
