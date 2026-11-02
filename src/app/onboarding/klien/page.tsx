"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { CitySearchPicker } from "@/components/city-search-picker"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { markOnboardingDone, needsOnboarding } from "@/lib/onboarding"
import { cn } from "@/lib/utils"

export default function ClientOnboardingPage() {
  const router = useRouter()
  const { ready, user, updateProfile, syncNotice, dismissSyncNotice } = useAuth()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name || "")
    setPhone(user.phone || "")
    setCity(user.city || "")
  }, [user])

  useEffect(() => {
    if (!ready || !user) return
    if (user.role === "owner") {
      router.replace(needsOnboarding(user) ? "/onboarding" : "/studio")
      return
    }
    if (!needsOnboarding(user)) {
      router.replace("/klien")
    }
  }, [ready, router, user])

  if (!ready || !user) return <StudioLoading />
  if (user.role !== "client" || !needsOnboarding(user)) return <StudioLoading />

  async function finish() {
    if (!name.trim() || !phone.trim() || !city.trim()) {
      setError("Lengkapi nama lengkap, nomor WhatsApp, dan wilayah/daerah.")
      return
    }
    setPending(true)
    setError("")
    markOnboardingDone(user?.email)
    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        onboardingStep: "done",
      })
      if (!updated) {
        window.location.href = "/klien"
        return
      }
      window.location.href = "/klien"
    } catch {
      window.location.href = "/klien"
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-center gap-6 px-4 py-10">
      {syncNotice ? (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
          <p>{syncNotice}</p>
          <button
            type="button"
            className="shrink-0 font-medium"
            onClick={dismissSyncNotice}
          >
            Tutup
          </button>
        </div>
      ) : null}

      <div>
        <p className="font-display text-2xl">Key Assistant</p>
        <p className="mt-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Lengkapi profil
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h1 className="text-3xl">Isi biodata kamu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Profil ini membantu vendor menghubungi kamu dan menyesuaikan
            pencarian di wilayahmu. Setelah ini kamu masuk ke Beranda.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="client-onboarding-name">Nama lengkap</Label>
          <Input
            id="client-onboarding-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama lengkap kamu"
            className="h-10"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="client-onboarding-email">Email</Label>
          <Input
            id="client-onboarding-email"
            value={user.email.endsWith("@riasaja.id") ? "" : user.email}
            readOnly
            placeholder="Email akun kamu"
            className="h-10 bg-muted/40"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="client-onboarding-phone">Nomor WhatsApp</Label>
          <Input
            id="client-onboarding-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="08xxxxxxxxxx"
            className="h-10"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="client-onboarding-city">Wilayah / Daerah</Label>
          <CitySearchPicker
            id="client-onboarding-city"
            value={city}
            onChange={setCity}
            placeholder="Ketik atau pilih kota"
            aria-label="Wilayah atau daerah"
            required
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="button"
          className={cn(buttonVariants(), "h-11")}
          disabled={pending}
          onClick={() => void finish()}
        >
          {pending ? "Menyimpan…" : "Simpan & masuk Beranda"}
        </button>
      </section>
    </div>
  )
}
