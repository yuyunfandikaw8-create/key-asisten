"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CITIES } from "@/lib/cities"

export default function RegisterPage() {
  const router = useRouter()
  const { ready, user, register } = useAuth()
  const { setCity } = useStudio()
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
    if (ready && user) router.replace("/studio")
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
    const result = await register({ name, email, phone, city, studioName, password })
    if (!result.ok) {
      if (result.error.includes("konfirmasi")) setInfo(result.error)
      else setError(result.error)
      setPending(false)
      return
    }
    setCity(result.user.city)
    router.replace("/studio")
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="font-display text-2xl">
          Key Assistant
        </Link>
        <h1 className="mt-4 text-4xl">Buat akun Key Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mulai kelola jadwal, klien, invoice, dan keuangan bisnis kamu dalam
          satu tempat.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <GoogleAuthButton
          mode="daftar"
          onSuccess={(nextUser) => {
            setCity(nextUser.city)
            router.replace("/studio")
          }}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          atau daftar dengan email
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nama pemilik</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10"
              placeholder="Masukkan nama kamu"
              required
            />
          </div>
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
            <Label htmlFor="city">Kota</Label>
            <Input
              id="city"
              list="city-options"
              value={city}
              onChange={(event) => setCityField(event.target.value)}
              placeholder="Pilih kota"
              className="h-10"
              required
              autoComplete="address-level2"
            />
            <datalist id="city-options">
              {CITIES.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              514 kabupaten/kota tersedia. Pilih dari daftar, atau ketik manual.
            </p>
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
          <Button type="submit" className="h-10" disabled={pending || !ready}>
            {pending ? "Menyimpan…" : "Buat Akun"}
          </Button>
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
