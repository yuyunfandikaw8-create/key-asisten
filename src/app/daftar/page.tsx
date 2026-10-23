"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { CitySearchPicker } from "@/components/city-search-picker"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homePathForUser, type AuthRole } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const { ready, user, register } = useAuth()
  const { setCity } = useStudio()
  const [role, setRole] = useState<AuthRole>("owner")
  const [name, setName] = useState("")
  const [studioName, setStudioName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCityField] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (ready && user) router.replace(homePathForUser(user))
  }, [ready, router, user])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    setInfo("")
    if (!city) {
      setError("Pilih kota dulu.")
      setPending(false)
      return
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi belum sama.")
      setPending(false)
      return
    }
    const result = await register({
      name,
      email,
      phone,
      city,
      studioName,
      password,
      role,
    })
    if (!result.ok) {
      if (result.error.includes("konfirmasi")) setInfo(result.error)
      else setError(result.error)
      setPending(false)
      return
    }
    if (result.user.role === "owner") {
      setCity(result.user.city)
    }
    router.replace(homePathForUser(result.user))
  }

  const isOwner = role === "owner"

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="font-display text-2xl">
          Key Assistant
        </Link>
        <h1 className="mt-4 text-4xl">Buat akun Key Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOwner
            ? "Coba gratis selama 14 hari. Kelola jadwal, klien, invoice, dan keuangan bisnis kamu dalam satu tempat."
            : "Cari vendor, lihat pricelist, dan ajukan jadwal tanpa chat berputar-putar."}
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="grid gap-1.5">
          <Label>Daftar sebagai</Label>
          <div
            role="radiogroup"
            aria-label="Pilih jenis akun"
            className="grid grid-cols-2 gap-2"
          >
            <button
              type="button"
              role="radio"
              aria-checked={isOwner}
              onClick={() => setRole("owner")}
              className={cn(
                "rounded-xl px-3 py-3 text-left ring-1 transition",
                isOwner
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10 hover:bg-muted/60"
              )}
            >
              <span className="block text-sm font-semibold">Owner bisnis</span>
              <span
                className={cn(
                  "mt-0.5 block text-xs",
                  isOwner ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                MUA, vendor, studio
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!isOwner}
              onClick={() => setRole("client")}
              className={cn(
                "rounded-xl px-3 py-3 text-left ring-1 transition",
                !isOwner
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10 hover:bg-muted/60"
              )}
            >
              <span className="block text-sm font-semibold">Klien</span>
              <span
                className={cn(
                  "mt-0.5 block text-xs",
                  !isOwner ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                Cari & booking vendor
              </span>
            </button>
          </div>
        </div>

        <GoogleAuthButton
          mode="daftar"
          role={role}
          nextPath={homePathForUser({ role })}
          onSuccess={(nextUser) => {
            if (nextUser.role === "owner") {
              setCity(nextUser.city)
            }
            router.replace(homePathForUser(nextUser))
          }}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          atau daftar dengan email
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">{isOwner ? "Nama pemilik" : "Nama lengkap"}</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10"
              placeholder="Masukkan nama kamu"
              required
            />
          </div>
          {isOwner ? (
            <div className="grid gap-1.5">
              <Label htmlFor="studio">Nama bisnis</Label>
              <Input
                id="studio"
                value={studioName}
                onChange={(event) => setStudioName(event.target.value)}
                className="h-10"
                placeholder="Masukkan nama bisnis kamu"
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10"
              placeholder="Masukkan email kamu"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10"
              placeholder="Contoh: 0812xxxxxxxx"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">Wilayah / Kota</Label>
            <CitySearchPicker
              id="city"
              value={city}
              onChange={setCityField}
              placeholder="Cari wilayah / kota"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Kata sandi</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10"
              placeholder="Buat kata sandi"
              required
              minLength={6}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password">Konfirmasi kata sandi</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-10"
              placeholder="Ulangi kata sandi"
              required
              minLength={6}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {info ? <p className="text-sm text-primary">{info}</p> : null}
          <button
            type="submit"
            className={cn(buttonVariants(), "h-10 w-full")}
            disabled={pending}
          >
            {pending ? "Menyimpan…" : isOwner ? "Buat Akun Owner" : "Buat Akun Klien"}
          </button>
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
