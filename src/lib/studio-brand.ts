import { studio } from "@/lib/catalog"
import {
  normalizePaymentSettings,
  type AuthUser,
  type PaymentSettings,
} from "@/lib/auth"

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
      slug: studio.slug,
      address: studio.address,
      bio: studio.bio,
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

  return {
    name: business,
    owner,
    city: user?.city?.trim() || studio.city,
    phone: user?.phone?.trim() || studio.phone,
    instagram: user?.instagram?.trim() || studio.instagram,
    bank,
    accountName,
    accountNumber,
    slug: studio.slug,
    address: user?.address?.trim() || studio.address,
    bio: studio.bio,
    payment,
  }
}

export function hasPaymentMethod(
  payment: PaymentSettings | undefined,
  method: PaymentSettings["methods"][number]
) {
  return Boolean(payment?.methods.includes(method))
}
