"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { CitySearchPicker } from "@/components/city-search-picker"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homePathForUser, type AuthRole } from "@/lib/auth"
import { cn } from "@/lib/utils"

function RoleChoiceCards({
  role,
  onSelect,
}: {
  role: AuthRole | null
  onSelect: (next: AuthRole) => void
}) {
  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => onSelect("owner")}
        className={cn(
          "rounded-2xl px-4 py-4 text-left ring-1 transition",
          role === "owner"
            ? "bg-primary/8 ring-primary"
            : "bg-card ring-foreground/10 hover:bg-muted/40"
        )}
      >
        <p className="text-lg font-medium">💼 Saya Mengelola Bisnis</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola booking, jadwal, invoice, keuangan, layanan, portofolio, dan
          partner bisnis dalam satu tempat.
        </p>
      </button>
      <button
        type="button"
        onClick={() => onSelect("client")}
        className={cn(
          "rounded-2xl px-4 py-4 text-left ring-1 transition",
          role === "client"
            ? "bg-primary/8 ring-primary"
            : "bg-card ring-foreground/10 hover:bg-muted/40"
        )}
      >
        <p className="text-lg font-medium">💍 Saya Mencari Jasa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Temukan dan pilih MUA, Hair & Hijab Stylist, dekorasi, fotografer,
          videografer, serta vendor acara lainnya.
        </p>
      </button>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { ready, user, register, chooseRole, logout } = useAuth()
  const [role, setRole] = useState<AuthRole | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const needsRole = Boolean(user) && user!.roleChosen === false

  useEffect(() => {
    if (!ready || !user) return
    // Belum pilih peran → tetap di sini. Selain itu arahkan ke rumah / onboarding.
    if (needsRole) return
    router.replace(homePathForUser(user))
  }, [needsRole, ready, router, user])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!role) {
      setError("Pilih cara kamu memakai Key Assistant dulu.")
      return
    }
    setPending(true)
    setError("")
    if (!accepted) {
      setError("Setujui Syarat & Ketentuan dan Kebijakan Privasi dulu.")
      setPending(false)
      return
    }
    if (role === "client" && (!phone.trim() || !city.trim())) {
      setError("Nomor WhatsApp dan wilayah/daerah wajib diisi untuk akun Klien.")
      setPending(false)
      return
    }
    const result = await register({
      name,
      email,
      password,
      role,
      phone: phone.trim(),
      city: city.trim(),
    })
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    if (result.notice) {
      try {
        sessionStorage.setItem("key-assistant.sync-notice", result.notice)
      } catch {
        // ignore
      }
    }
    // Email sudah terdaftar → masuk ke rumah (Beranda / Data Saya / onboarding bila belum selesai).
    // Akun baru → onboarding lewat homePathForUser.
    router.replace(homePathForUser(result.user))
  }

  async function continueExistingAccount() {
    if (!role) {
      setError("Pilih salah satu opsi di atas.")
      return
    }
    if (role === "client" && (!phone.trim() || !city.trim())) {
      setError("Nomor WhatsApp dan wilayah/daerah wajib diisi untuk akun Klien.")
      return
    }
    setPending(true)
    setError("")
    const result = await chooseRole(role, {
      phone: phone.trim(),
      city: city.trim(),
    })
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    router.replace(homePathForUser(result.user))
  }

  if (!ready) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md content-center px-4 py-10 text-sm text-muted-foreground">
        Memuat…
      </div>
    )
  }

  // Sudah masuk tapi belum pilih / belum selesai setup → pilih peran di sini.
  if (user && needsRole) {
    return (
      <div className="mx-auto grid min-h-screen max-w-lg content-center gap-6 px-4 py-10">
        <div>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke beranda
          </Link>
          <div>
            <Link href="/" className="font-display text-2xl">
              Key Assistant
            </Link>
          </div>
          <h1 className="mt-4 text-4xl">Pilih cara kamu menggunakan Key Assistant</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halo{user.name ? `, ${user.name}` : ""}. Pilih apakah kamu mengelola
            bisnis atau mencari jasa.
          </p>
        </div>

        <RoleChoiceCards
          role={role}
          onSelect={(next) => {
            setRole(next)
            setError("")
          }}
        />

        {role === "client" ? (
          <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="grid gap-1.5">
              <Label htmlFor="role-phone">Nomor WhatsApp</Label>
              <Input
                id="role-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-10"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role-city">Wilayah / Daerah</Label>
              <CitySearchPicker
                id="role-city"
                value={city}
                onChange={setCity}
                placeholder="Ketik atau pilih kota"
                aria-label="Wilayah atau daerah"
                required
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="button"
          className={cn(
            buttonVariants(),
            "h-11",
            !role && !pending ? "opacity-60" : null
          )}
          disabled={pending}
          onClick={() => void continueExistingAccount()}
        >
          {pending ? "Menyimpan…" : "Lanjutkan"}
        </button>

        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => void logout().then(() => router.replace("/daftar"))}
        >
          Bukan akun ini? Keluar dan daftar ulang
        </button>
      </div>
    )
  }

  if (user) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md content-center px-4 py-10 text-sm text-muted-foreground">
        Memuat…
      </div>
    )
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-center gap-6 px-4 py-10">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke beranda
        </Link>
        <div>
          <Link href="/" className="font-display text-2xl">
            Key Assistant
          </Link>
        </div>
        <h1 className="mt-4 text-4xl">Buat Akun Key Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Satu akun untuk mengelola bisnis atau menemukan vendor yang sesuai
          dengan kebutuhan acaramu.
        </p>
        <p className="mt-2 text-sm font-medium">
          Daftar gratis dan mulai gunakan Key Assistant.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">
          Pilih cara kamu menggunakan Key Assistant
        </p>
      </div>

      <RoleChoiceCards
        role={role}
        onSelect={(next) => {
          setRole(next)
          setError("")
        }}
      />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        daftar dengan email
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10"
              placeholder="Nama lengkap kamu"
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
            <Label htmlFor="password">Kata sandi</Label>
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
          {role === "client" ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-10"
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="city">Wilayah / Daerah</Label>
                <CitySearchPicker
                  id="city"
                  value={city}
                  onChange={setCity}
                  placeholder="Ketik atau pilih kota"
                  aria-label="Wilayah atau daerah"
                  required
                />
              </div>
            </>
          ) : null}
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
