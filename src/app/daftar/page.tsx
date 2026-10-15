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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CITIES } from "@/lib/cities"

export default function RegisterPage() {
  const router = useRouter()
  const { ready, user, register, supabaseReady } = useAuth()
  const { setCity } = useStudio()
  const [name, setName] = useState("")
  const [studioName, setStudioName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCityField] = useState("Bandung")
  const [password, setPassword] = useState("")
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
          Riasaja
        </Link>
        <h1 className="mt-4 text-4xl">Daftar studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {supabaseReady
            ? "Daftar lewat Supabase. Setelah daftar, cek email untuk konfirmasi jika diminta."
            : "Buat akun di browser ini dulu."}
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
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} className="h-10" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="studio">Nama studio</Label>
          <Input
            id="studio"
            value={studioName}
            onChange={(event) => setStudioName(event.target.value)}
            className="h-10"
            placeholder="Studio rias kamu"
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
            placeholder="08…"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Kota aktif</Label>
          <Select value={city} onValueChange={(value) => value && setCityField(value)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue>{(value) => String(value ?? city)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Kata sandi</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10"
            required
            minLength={6}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {info ? <p className="text-sm text-primary">{info}</p> : null}
        <Button type="submit" className="h-10" disabled={pending || !ready}>
          {pending ? "Menyimpan…" : "Buat akun"}
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
