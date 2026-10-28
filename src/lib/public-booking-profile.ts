import type { AuthUser } from "@/lib/auth"
import { packages } from "@/lib/catalog"
import {
  canCloudSync,
  listPublicBookingProfilesCloud,
  pullPublicBookingProfileCloud,
  pushPublicBookingProfileCloud,
} from "@/lib/cloud-sync"
import type { BusinessFieldId, BusinessService } from "@/lib/onboarding"
import {
  demoBio,
  demoPortfolioItems,
  normalizePortfolioList,
  visiblePortfolio,
  type PortfolioItem,
} from "@/lib/portfolio"
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
  bio?: string
  rating?: number
  address?: string
  instagram?: string
  logoDataUrl?: string
  businessFields?: BusinessFieldId[]
  /** Hanya item yang ditampilkan ke publik (visible). */
  portfolio?: PortfolioItem[]
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
    // ignore quota / private mode — coba tanpa logo besar
    try {
      const slim: ProfileMap = {}
      for (const [key, profile] of Object.entries(map)) {
        slim[key] = { ...profile, logoDataUrl: undefined }
      }
      localStorage.setItem(PUBLIC_BOOKING_PROFILE_KEY, JSON.stringify(slim))
    } catch {
      // ignore
    }
  }
}

function normalizeProfile(profile: PublicBookingProfile, slug: string): PublicBookingProfile {
  return {
    ...profile,
    slug,
    services: (profile.services || [])
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
    portfolio: visiblePortfolio(normalizePortfolioList(profile.portfolio)),
    businessFields: Array.isArray(profile.businessFields)
      ? profile.businessFields
      : undefined,
    bio: profile.bio?.trim() || undefined,
    address: profile.address?.trim() || undefined,
    instagram: profile.instagram?.trim() || undefined,
    rating:
      typeof profile.rating === "number" && Number.isFinite(profile.rating)
        ? profile.rating
        : undefined,
  }
}

export function readPublicBookingProfile(slug: string): PublicBookingProfile | null {
  const key = slug.trim().toLowerCase()
  if (!key) return null
  const profile = readMap()[key]
  if (!profile || !Array.isArray(profile.services)) return null
  return normalizeProfile(profile, key)
}

/** Lokal dulu, lalu cloud — untuk /p/[slug] lintas perangkat. */
export async function loadPublicBookingProfile(
  slug: string
): Promise<PublicBookingProfile | null> {
  const local = readPublicBookingProfile(slug)
  const cloud = await pullPublicBookingProfileCloud(slug)
  if (!cloud) return local
  const fromCloud: PublicBookingProfile = normalizeProfile(
    {
      slug: cloud.slug,
      name: cloud.name,
      phone: cloud.phone,
      city: cloud.city,
      services: coerceCloudServices(cloud.services),
      updatedAt: cloud.updatedAt,
      bio: cloud.bio,
      rating: cloud.rating,
      address: cloud.address,
      instagram: cloud.instagram,
      logoDataUrl: cloud.logoDataUrl,
      businessFields: cloud.businessFields,
      portfolio: normalizePortfolioList(cloud.portfolio),
    },
    cloud.slug
  )
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
  bio?: string
  rating?: number
  address?: string
  instagram?: string
  logoDataUrl?: string
  businessFields?: BusinessFieldId[]
  portfolio?: PortfolioItem[] | null
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
    bio: input.bio?.trim() || undefined,
    rating:
      typeof input.rating === "number" && Number.isFinite(input.rating)
        ? input.rating
        : undefined,
    address: input.address?.trim() || undefined,
    instagram: input.instagram?.trim() || undefined,
    logoDataUrl: input.logoDataUrl,
    businessFields: input.businessFields,
    portfolio: visiblePortfolio(normalizePortfolioList(input.portfolio)),
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

/** Publish dari akun login (halaman Link booking / editor layanan / profil). */
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
    bio: options?.demo ? demoBio() : brand.bio,
    rating: brand.rating ?? (options?.demo ? 4.9 : undefined),
    address: brand.address,
    instagram: brand.instagram,
    logoDataUrl: brand.logoDataUrl,
    businessFields: [...brand.businessFields],
    portfolio: options?.demo ? demoPortfolioItems() : brand.portfolio,
  })
}

export function startingPrice(services: PublicBookingService[] | undefined | null) {
  if (!services?.length) return null
  return Math.min(...services.map((service) => service.price))
}

export function listLocalPublicBookingProfiles(): PublicBookingProfile[] {
  return Object.values(readMap())
    .map((profile) => normalizeProfile(profile, profile.slug))
    .filter(
      (profile) =>
        (profile.portfolio?.length ?? 0) > 0 || (profile.services?.length ?? 0) > 0
    )
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

/** Profil Owner yang sudah dipublish — sumber Cari Vendor klien. */
export async function listDiscoverablePublicProfiles(): Promise<PublicBookingProfile[]> {
  const local = listLocalPublicBookingProfiles()
  const bySlug = new Map(local.map((profile) => [profile.slug, profile]))
  const cloudRows = await listPublicBookingProfilesCloud()
  for (const cloud of cloudRows) {
    const fromCloud = normalizeProfile(
      {
        slug: cloud.slug,
        name: cloud.name,
        phone: cloud.phone,
        city: cloud.city,
        services: coerceCloudServices(cloud.services),
        updatedAt: cloud.updatedAt,
        bio: cloud.bio,
        rating: cloud.rating,
        address: cloud.address,
        instagram: cloud.instagram,
        logoDataUrl: cloud.logoDataUrl,
        businessFields: cloud.businessFields,
        portfolio: normalizePortfolioList(cloud.portfolio),
      },
      cloud.slug
    )
    if (!(fromCloud.portfolio?.length || fromCloud.services?.length)) continue
    const existing = bySlug.get(fromCloud.slug)
    if (
      !existing ||
      Date.parse(fromCloud.updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      bySlug.set(fromCloud.slug, fromCloud)
    }
  }
  const merged = [...bySlug.values()]
  writeMap(Object.fromEntries(merged.map((profile) => [profile.slug, profile])))
  return merged.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export const PUBLIC_VENDOR_SHORTLIST_PREFIX = "pub:"

export function publicVendorShortlistId(slug: string) {
  return `${PUBLIC_VENDOR_SHORTLIST_PREFIX}${slug.trim().toLowerCase()}`
}

export function parsePublicVendorShortlistId(id: string) {
  if (!id.startsWith(PUBLIC_VENDOR_SHORTLIST_PREFIX)) return null
  return id.slice(PUBLIC_VENDOR_SHORTLIST_PREFIX.length)
}
