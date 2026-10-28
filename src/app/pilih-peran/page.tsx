"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { homePathForUser, type AuthRole } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function ChooseRolePage() {
  const router = useRouter()
  const { ready, user, chooseRole } = useAuth()
  const [role, setRole] = useState<AuthRole | null>(null)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace("/masuk?next=/pilih-peran")
      return
    }
    if (user.roleChosen !== false) {
      router.replace(homePathForUser(user))
    }
  }, [ready, router, user])

  async function continueWithRole() {
    if (!role) {
      setError("Pilih salah satu opsi di atas.")
      return
    }
    setPending(true)
    setError("")
    const result = await chooseRole(role)
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    router.replace(homePathForUser(result.user))
  }

  if (!ready || !user || user.roleChosen !== false) {
    return (
      <div className="mx-auto grid min-h-screen max-w-lg content-center px-4 py-10 text-sm text-muted-foreground">
        Memuat…
      </div>
    )
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="font-display text-2xl">
          Key Assistant
        </Link>
        <h1 className="mt-4 text-4xl">Selamat datang di Key Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kamu menggunakan Key Assistant sebagai apa?
        </p>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => {
            setRole("owner")
            setError("")
          }}
          className={cn(
            "rounded-2xl px-4 py-4 text-left ring-1 transition",
            role === "owner"
              ? "bg-primary/8 ring-primary"
              : "bg-card ring-foreground/10 hover:bg-muted/40"
          )}
        >
          <p className="text-lg font-medium">💼 Saya mengelola bisnis</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola booking, jadwal, invoice, keuangan, layanan, dan partner.
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("client")
            setError("")
          }}
          className={cn(
            "rounded-2xl px-4 py-4 text-left ring-1 transition",
            role === "client"
              ? "bg-primary/8 ring-primary"
              : "bg-card ring-foreground/10 hover:bg-muted/40"
          )}
        >
          <p className="text-lg font-medium">💍 Saya sedang mencari jasa</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cari dan pilih MUA, Hair Stylist, Decoration, Photographer, Videographer,
            dan vendor lainnya.
          </p>
        </button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="button"
        className={cn(
          buttonVariants(),
          "h-11",
          !role && !pending ? "opacity-60" : null
        )}
        disabled={pending}
        onClick={() => void continueWithRole()}
      >
        {pending ? "Menyimpan…" : "Lanjutkan"}
      </button>
    </div>
  )
}
