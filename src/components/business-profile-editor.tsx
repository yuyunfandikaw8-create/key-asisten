"use client"

import { useEffect, useState } from "react"
import { ImagePlus } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { CitySearchPicker } from "@/components/city-search-picker"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Props = {
  /** Extra class on the outer section. */
  className?: string
  onSaved?: () => void
}

export function BusinessProfileEditor({ className, onSaved }: Props) {
  const { user, updateProfile } = useAuth()
  const { setCity } = useStudio()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const [studioName, setStudioName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [phone, setPhone] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [city, setCityField] = useState("")
  const [instagram, setInstagram] = useState("")
  const [address, setAddress] = useState("")
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!user) return
    setStudioName(user.studioName || "")
    setOwnerName(user.name || "")
    setPhone(user.phone || "")
    setBusinessEmail(user.businessEmail || user.email || "")
    setCityField(user.city || "")
    setInstagram(user.instagram || "")
    setAddress(user.address || "")
    setLogoDataUrl(user.logoDataUrl)
  }, [user])

  async function onLogoChange(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Unggah file gambar untuk logo.")
      return
    }
    if (file.size > 1_500_000) {
      setError("Logo maksimal sekitar 1,5 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoDataUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!user) return
    if (!studioName.trim() || !ownerName.trim() || !phone.trim() || !city.trim()) {
      setError("Nama bisnis, pemilik, WhatsApp, dan kota wajib diisi.")
      setSaved(false)
      return
    }
    setPending(true)
    setError("")
    setSaved(false)
    const updated = await updateProfile({
      studioName: studioName.trim(),
      name: ownerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      businessEmail: businessEmail.trim() || user.email,
      instagram: instagram.trim(),
      address: address.trim(),
      logoDataUrl,
    })
    setPending(false)
    if (!updated) {
      setError("Gagal menyimpan. Coba lagi.")
      return
    }
    setCity(city.trim())
    setSaved(true)
    onSaved?.()
  }

  if (!user) return null

  return (
    <section className={cn("grid gap-4", className)}>
      <div className="grid gap-1.5">
        <Label>Logo bisnis</Label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-foreground/20 px-4 py-4 transition hover:bg-muted/40">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              alt="Logo bisnis"
              className="size-14 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-xl bg-muted">
              <ImagePlus className="size-5 text-muted-foreground" />
            </span>
          )}
          <span className="text-sm font-medium">+ Tambahkan logo</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void onLogoChange(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ops-studio">Nama bisnis</Label>
        <Input
          id="ops-studio"
          value={studioName}
          onChange={(event) => setStudioName(event.target.value)}
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ops-owner">Nama pemilik</Label>
        <Input
          id="ops-owner"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ops-phone">WhatsApp bisnis</Label>
        <Input
          id="ops-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ops-email">Email bisnis</Label>
        <Input
          id="ops-email"
          type="email"
          value={businessEmail}
          onChange={(event) => setBusinessEmail(event.target.value)}
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ops-city">Kota / Wilayah</Label>
        <CitySearchPicker
          id="ops-city"
          value={city}
          onChange={setCityField}
          placeholder="Cari kota"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ops-ig">Instagram</Label>
        <Input
          id="ops-ig"
          value={instagram}
          onChange={(event) => setInstagram(event.target.value)}
          placeholder="@namabisnis"
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ops-address">Alamat</Label>
        <Textarea
          id="ops-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Opsional"
          className="min-h-20"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-primary">Profil bisnis tersimpan.</p>
      ) : null}

      <button
        type="button"
        className={cn(buttonVariants(), "h-11")}
        disabled={pending}
        onClick={() => void save()}
      >
        {pending ? "Menyimpan…" : "Simpan profil"}
      </button>
    </section>
  )
}
