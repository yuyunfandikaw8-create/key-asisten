/**
 * Helper admin: baca akun lokal & pembayaran langganan pending.
 */

import {
  ACCOUNTS_STORAGE_KEY,
  DEMO_ACCOUNTS,
  normalizeEmail,
  type StoredAccount,
} from "@/lib/auth"
import { periodEndsAt, type SubscriptionPaymentRecord } from "@/lib/trial"

export function readAllLocalAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [...DEMO_ACCOUNTS]
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return [...DEMO_ACCOUNTS]
    const parsed = JSON.parse(raw) as StoredAccount[]
    if (!Array.isArray(parsed)) return [...DEMO_ACCOUNTS]
    const extras = parsed.filter(
      (account) =>
        !DEMO_ACCOUNTS.some(
          (demo) => demo.email === normalizeEmail(account.email)
        )
    )
    return [...DEMO_ACCOUNTS, ...extras]
  } catch {
    return [...DEMO_ACCOUNTS]
  }
}

export function writeLocalAccountsExtras(accounts: StoredAccount[]) {
  const extras = accounts.filter(
    (account) =>
      !DEMO_ACCOUNTS.some((demo) => demo.email === normalizeEmail(account.email))
  )
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(extras))
}

export function purgeRegisteredAccounts() {
  localStorage.removeItem(ACCOUNTS_STORAGE_KEY)
}

export type PendingSubscriptionPayment = {
  accountEmail: string
  accountName: string
  accountId: string
  payment: SubscriptionPaymentRecord
  subscriptionStatus?: string
}

export function listPendingSubscriptionPayments(): PendingSubscriptionPayment[] {
  const rows: PendingSubscriptionPayment[] = []
  for (const account of readAllLocalAccounts()) {
    if (account.role !== "owner") continue
    const payments = account.subscription?.payments ?? []
    for (const payment of payments) {
      if (payment.status !== "pending") continue
      rows.push({
        accountEmail: account.email,
        accountName: account.studioName || account.name || account.email,
        accountId: account.id,
        payment,
        subscriptionStatus: account.subscription?.status,
      })
    }
  }
  return rows.sort((a, b) =>
    b.payment.createdAt.localeCompare(a.payment.createdAt)
  )
}

export function verifyAccountPayment(input: {
  email: string
  paymentId: string
}) {
  const email = normalizeEmail(input.email)
  const accounts = readAllLocalAccounts()
  const index = accounts.findIndex((item) => item.email === email)
  if (index < 0) return { ok: false as const, error: "Akun tidak ditemukan." }
  const account = accounts[index]
  const payments = account.subscription?.payments ?? []
  const payment = payments.find((item) => item.id === input.paymentId)
  if (!payment || payment.status !== "pending") {
    return { ok: false as const, error: "Pembayaran pending tidak ditemukan." }
  }
  const paidAt = new Date().toISOString()
  const nextPayments = payments.map((item) =>
    item.id === payment.id ? { ...item, status: "paid" as const, paidAt } : item
  )
  const next: StoredAccount = {
    ...account,
    subscription: {
      planId: account.subscription?.planId || "key-assistant",
      planName: account.subscription?.planName || "Key Assistant",
      status: "active",
      period: payment.period,
      paymentMethod: payment.paymentMethod,
      startedAt: paidAt,
      endsAt: periodEndsAt(paidAt, payment.period),
      payments: nextPayments,
    },
  }
  const nextAccounts = [...accounts]
  nextAccounts[index] = next
  writeLocalAccountsExtras(nextAccounts)
  return { ok: true as const, account: next }
}
