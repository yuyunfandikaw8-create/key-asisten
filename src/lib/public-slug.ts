import { studio } from "@/lib/catalog"

/** Slug aman untuk URL profil publik `/p/[slug]`. */
export function slugifyPublicName(value: string | undefined | null) {
  const base = (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return base || studio.slug
}

export function resolvePublicSlug(input: {
  publicSlug?: string | null
  studioName?: string | null
  name?: string | null
  fallback?: string
}) {
  const explicit = input.publicSlug?.trim().toLowerCase()
  if (explicit) return slugifyPublicName(explicit)
  const fromStudio = input.studioName?.trim()
  if (fromStudio) return slugifyPublicName(fromStudio)
  const fromName = input.name?.trim()
  if (fromName) return slugifyPublicName(fromName)
  return input.fallback || studio.slug
}
