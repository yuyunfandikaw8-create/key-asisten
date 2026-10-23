"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homePathForUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const { ready, user, register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (ready && user) router.replace(homePathForUser(user))
  }, [ready, router, user])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    if (!accepted) {
      setError("Setujui Syarat & Ketentuan dan Kebijakan Privasi dulu.")
      setPending(false)
      return
    }
    const result = await register({ name, email, password })
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    router.replace("/onboarding")
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="font-display text-2xl">
          Key Assistant
        </Link>
        <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Step 1 — Buat akun
        </p>
        <h1 className="mt-2 text-4xl">Buat akun kamu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola bisnis beauty, wedding & event dalam satu tempat.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <GoogleAuthButton
          mode="daftar"
          nextPath="/onboarding"
          onSuccess={(nextUser) => {
            router.replace(homePathForUser(nextUser))
          }}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          atau
          <span className="h-px flex-1 bg-border" />
        </div>
        <p className="text-center text-sm font-medium">Daftar dengan email</p>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10"
              placeholder="Nama kamu"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10"
              placeholder="nama@email.com"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
            />
          </div>
          <label className="flex items-start gap-2 text-sm leading-snug">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 size-4 accent-primary"
            />
            <span>
              Saya menyetujui{" "}
              <Link href="/syarat" className="font-medium text-primary hover:underline">
                Syarat & Ketentuan
              </Link>{" "}
              dan{" "}
              <Link href="/privasi" className="font-medium text-primary hover:underline">
                Kebijakan Privasi
              </Link>
            </span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="submit"
            className={cn(buttonVariants(), "h-11 w-full")}
            disabled={pending}
          >
            {pending ? "Menyimpan…" : "Buat Akun"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Coba gratis 14 hari
          </p>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  )
}
