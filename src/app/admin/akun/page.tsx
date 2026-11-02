"use client"

import { useCallback, useEffect, useState } from "react"

import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  purgeRegisteredAccounts,
  readAllLocalAccounts,
} from "@/lib/admin-accounts"
import { DEMO_ACCOUNTS, type StoredAccount } from "@/lib/auth"
import { getSubscriptionStatus, subscriptionStatusLabel } from "@/lib/trial"
import { cn } from "@/lib/utils"

export default function AdminAkunPage() {
  const [ready, setReady] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [notice, setNotice] = useState("")

  const refresh = useCallback(() => {
    setAccounts(readAllLocalAccounts())
  }, [])

  useEffect(() => {
    refresh()
    setReady(true)
  }, [refresh])

  if (!ready) return <StudioLoading />

  const fixEmails = new Set(DEMO_ACCOUNTS.map((item) => item.email))
  const registered = accounts.filter((item) => !fixEmails.has(item.email))

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Akun</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Daftar akun lokal di perangkat ini. Akun perbaikan tetap aman saat
          purge.
        </p>
      </div>

      {notice ? (
        <p className="rounded-xl bg-primary/8 px-3 py-3 text-sm text-primary">
          {notice}
        </p>
      ) : null}

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl">Semua akun</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {accounts.length} akun · {registered.length} terdaftar (non-perbaikan)
            </p>
          </div>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "h-10")}
            onClick={() => {
              purgeRegisteredAccounts()
              refresh()
              setNotice(
                "Email terdaftar lokal dihapus. Akun perbaikan (owner/klien/admin) tetap ada."
              )
            }}
          >
            Hapus akun terdaftar
          </button>
        </div>

        <ul className="grid gap-2">
          {accounts.map((account) => {
            const isFix = fixEmails.has(account.email)
            const status =
              account.role === "owner"
                ? subscriptionStatusLabel(getSubscriptionStatus(account))
                : account.role
            return (
              <li
                key={account.id}
                className="rounded-xl bg-background px-3 py-3 text-sm ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {account.studioName || account.name || "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {isFix ? "perbaikan" : "terdaftar"} · {account.role}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{account.email}</p>
                {account.role === "owner" ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Langganan: {status}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
