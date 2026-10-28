import { studio } from "@/lib/catalog"
import {
  normalizePaymentSettings,
  type AuthUser,
  type PaymentSettings,
} from "@/lib/auth"
import { demoBio, demoPortfolioItems, normalizePortfolioList } from "@/lib/portfolio"
import { resolvePublicSlug } from "@/lib/public-slug"

/** Nama bisnis / owner dari akun login, fallback ke data demo katalog. */
export function studioBrand(
  user: AuthUser | null | undefined,
  options?: { demo?: boolean }
) {
  // Data contoh selalu memakai identitas katalog Key Partner, bukan nama bisnis owner.
  if (options?.demo) {
    return {
      name: studio.name,
      owner: studio.owner,
      city: studio.city,
      phone: studio.phone,
      instagram: studio.instagram,
      bank: studio.bank,
      accountName: studio.accountName,
      accountNumber: studio.accountNumber,
      ewalletName: "",
      ewalletNumber: "",
      slug: studio.slug,
      address: studio.address,
      bio: demoBio(),
      rating: 4.9,
      portfolio: demoPortfolioItems(),
      businessFields: ["makeup", "hair", "baju"],
      logoDataUrl: undefined as string | undefined,
      payment: normalizePaymentSettings({
        methods: ["transfer", "qris"],
        bankName: studio.bank,
        accountNumber: studio.accountNumber,
        accountHolder: studio.accountName,
      }),
    }
  }

  const business =
    user?.studioName?.trim() ||
    user?.name?.trim() ||
    studio.name
  const owner = user?.name?.trim() || business
  const payment = normalizePaymentSettings(user?.paymentSettings)
  const bank = payment.bankName || studio.bank
  const accountName = payment.accountHolder || owner
  const accountNumber = payment.accountNumber || studio.accountNumber
  const portfolio = normalizePortfolioList(user?.portfolio)
  const rating =
    typeof user?.rating === "number" && Number.isFinite(user.rating)
      ? user.rating
      : undefined

  return {
    name: business,
    owner,
    city: user?.city?.trim() || studio.city,
    phone: user?.phone?.trim() || studio.phone,
    instagram: user?.instagram?.trim() || studio.instagram,
    bank,
    accountName,
    accountNumber,
    ewalletName: payment.ewalletName || "",
    ewalletNumber: payment.ewalletNumber || "",
    slug: resolvePublicSlug({
      publicSlug: user?.publicSlug,
      studioName: user?.studioName,
      name: user?.name,
      fallback: studio.slug,
    }),
    address: user?.address?.trim() || studio.address,
    bio: user?.bio?.trim() || studio.bio,
    rating,
    portfolio,
    businessFields: user?.businessFields || [],
    logoDataUrl: user?.logoDataUrl,
    payment,
  }
}

export function hasPaymentMethod(
  payment: PaymentSettings | undefined,
  method: PaymentSettings["methods"][number]
) {
  return Boolean(payment?.methods.includes(method))
}
