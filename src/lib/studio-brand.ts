import { studio } from "@/lib/catalog"
import type { AuthUser } from "@/lib/auth"

/** Nama bisnis / owner dari akun login, fallback ke data demo katalog. */
export function studioBrand(user: AuthUser | null | undefined) {
  const business =
    user?.studioName?.trim() ||
    user?.name?.trim() ||
    studio.name
  const owner = user?.name?.trim() || business

  return {
    name: business,
    owner,
    city: user?.city?.trim() || studio.city,
    phone: user?.phone?.trim() || studio.phone,
    instagram: studio.instagram,
    bank: studio.bank,
    accountName: owner,
    accountNumber: studio.accountNumber,
    slug: studio.slug,
    address: studio.address,
    bio: studio.bio,
  }
}
