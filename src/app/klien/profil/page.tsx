"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function ClientProfilePage() {
  const { ready, user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [city, setCity] = useState(user?.city || "")
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  if (!ready || !user) return <StudioLoading />

  async function save() {
    setPending(true)
    setError("")
    setSaved(false)
    const updated = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
    })
    setPending(false)
    if (!updated) {
      setError("Gagal menyimpan.")
      return
    }
    setSaved(true)
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Data klien dan pengaturan akun.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="grid gap-1.5">
          <Label htmlFor="client-name">Nama</Label>
          <Input
            id="client-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 bg-background"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            value={user.email}
            readOnly
            className="h-11 bg-muted/40"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="client-phone">WhatsApp</Label>
          <Input
            id="client-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="08…"
            className="h-11 bg-background"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="client-city">Kota acara</Label>
          <Input
            id="client-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Surabaya"
            className="h-11 bg-background"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-primary">Profil tersimpan.</p> : null}
        <button
          type="button"
          className={cn(buttonVariants(), "h-11 w-fit")}
          disabled={pending}
          onClick={() => void save()}
        >
          {pending ? "Menyimpan…" : "Simpan profil"}
        </button>
      </section>
    </div>
  )
}
