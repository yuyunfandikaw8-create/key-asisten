import type { AuthUser } from "@/lib/auth"
import { packages } from "@/lib/catalog"
import type { BusinessService } from "@/lib/onboarding"
import { studioBrand } from "@/lib/studio-brand"

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

/** Simpan snapshot layanan + identitas owner agar halaman /p/[slug] tidak pakai katalog. */
export function publishPublicBookingProfile(input: {
  slug: string
  name: string
  phone: string
  city?: string
  services: BusinessService[] | undefined | null
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
  })
}
