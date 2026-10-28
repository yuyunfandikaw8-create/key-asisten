"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homePathForUser, QUICK_TEST_LOGINS, type AuthUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

function resolveNextPath(requested: string, user: AuthUser) {
  const home = homePathForUser(user)
  if (user.roleChosen === false) return home
  if (!requested.startsWith("/")) return home
  if (requested.startsWith("/pilih-peran")) return home
  if (user.role === "client" && requested.startsWith("/studio")) return home
  if (user.role === "owner" && requested.startsWith("/klien")) return home
  return requested
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { ready, user, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const requestedNext = (() => {
    const next = params.get("next") || ""
    return next.startsWith("/") ? next : ""
  })()

  useEffect(() => {
    if (ready && user) {
      router.replace(resolveNextPath(requestedNext || homePathForUser(user), user))
    }
  }, [ready, requestedNext, router, user])

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
    // Jangan setCity di sini — wilayah Data saya milik owner dan tidak diganti saat login.
    router.replace(
      resolveNextPath(requestedNext || homePathForUser(result.user), result.user)
    )
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-4 py-10">
      <div>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mb-4 h-9 w-fit gap-1.5"
          )}
        >
          <ArrowLeft className="size-4" />
          Kembali ke beranda
        </Link>
        <div>
          <Link href="/" className="font-display text-2xl">
            Key Assistant
          </Link>
        </div>
        <h1 className="mt-4 text-4xl">Selamat datang di Key Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masuk untuk mengelola jadwal, klien, invoice, keuangan, dan kolaborasi
          dengan lebih mudah dalam satu tempat.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <p className="text-sm font-medium">Akun uji (ubah & perbaiki fitur)</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ketuk untuk mengisi email & sandi, lalu masuk.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUICK_TEST_LOGINS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="rounded-xl bg-muted/50 px-3 py-3 text-left ring-1 ring-foreground/10 transition hover:bg-muted"
              onClick={() => {
                setEmail(account.email)
                setPassword(account.password)
                setError("")
              }}
            >
              <span className="block text-sm font-medium">{account.label}</span>
              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                {account.email}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{account.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <GoogleAuthButton
          mode="masuk"
          nextPath={
            requestedNext && !requestedNext.startsWith("/pilih-peran")
              ? requestedNext
              : "/daftar"
          }
          onSuccess={(nextUser) => {
            router.replace(
              resolveNextPath(requestedNext || homePathForUser(nextUser), nextUser)
            )
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
              placeholder="Masukkan email kamu"
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
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="submit"
            className={cn(buttonVariants(), "h-10 w-full")}
            disabled={pending}
          >
            {pending ? "Masuk…" : "Masuk ke Key Assistant"}
          </button>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-primary hover:underline">
          Daftar sekarang
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
