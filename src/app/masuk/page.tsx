"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEMO_ACCOUNTS } from "@/lib/auth"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { ready, user, login, supabaseReady } = useAuth()
  const { setCity } = useStudio()
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email)
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].password)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const nextPath = (() => {
    const next = params.get("next") || "/studio"
    return next.startsWith("/") ? next : "/studio"
  })()

  useEffect(() => {
    if (ready && user) router.replace(nextPath)
  }, [nextPath, ready, router, user])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    const result = await login(email, password)
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    setCity(result.user.city)
    router.replace(nextPath)
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="font-display text-2xl">
          Key Assistant
        </Link>
        <h1 className="mt-4 text-4xl">Masuk studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masuk untuk membuka jadwal, inbox partner, invoice, dan kombo.
          {supabaseReady
            ? " Email baru lewat Supabase. Akun contoh tetap bisa dipakai lokal."
            : " Data demo tersimpan di browser ini."}
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <GoogleAuthButton
          mode="masuk"
          nextPath={nextPath}
          onSuccess={(nextUser) => {
            setCity(nextUser.city)
            router.replace(nextPath)
          }}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          atau masuk dengan email
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Kata sandi</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-10" disabled={pending || !ready}>
            {pending ? "Masuk…" : "Masuk"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl bg-accent/60 px-4 py-3 text-sm">
        <p className="font-medium">Akun contoh</p>
        <p className="mt-1 text-muted-foreground">
          Bandung: {DEMO_ACCOUNTS[0].email} / {DEMO_ACCOUNTS[0].password}
        </p>
        <p className="text-muted-foreground">
          Surabaya: {DEMO_ACCOUNTS[1].email} / {DEMO_ACCOUNTS[1].password}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-primary hover:underline">
          Daftar studio
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Memuat…</div>}>
      <LoginForm />
    </Suspense>
  )
}
