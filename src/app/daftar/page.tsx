"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homePathForUser, type AuthRole } from "@/lib/auth"
import { markOnboardingDone, needsOnboarding } from "@/lib/onboarding"
import { cn } from "@/lib/utils"

type Step = "role" | "form"

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
        <p className="text-lg font-medium">💼 Saya mengelola bisnis</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola booking, jadwal, invoice, keuangan, layanan, dan partner.
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
        <p className="text-lg font-medium">💍 Saya sedang mencari jasa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cari dan pilih MUA, Hair Stylist, Decoration, Photographer, Videographer, dan
          vendor lainnya.
        </p>
      </button>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { ready, user, register, chooseRole, logout } = useAuth()
  const [step, setStep] = useState<Step>("role")
  const [role, setRole] = useState<AuthRole | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const needsRole =
    Boolean(user) && (user!.roleChosen === false || needsOnboarding(user))

  useEffect(() => {
    if (!ready || !user) return
    // Akun sudah lengkap → masuk ke rumah masing-masing. Jangan redirect saat masih
    // perlu pilih peran (tampilkan pilihan di halaman ini supaya tidak “mental”).
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
    const result = await register({ name, email, password, role })
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
    if (role === "client") {
      markOnboardingDone(result.user.email)
      router.replace("/klien")
      return
    }
    router.replace("/onboarding")
  }

  async function continueExistingAccount() {
    if (!role) {
      setError("Pilih salah satu opsi di atas.")
      return
    }
    setPending(true)
    setError("")
    const result = await chooseRole(role)
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
          <h1 className="mt-4 text-4xl">Selamat datang di Key Assistant</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halo{user.name ? `, ${user.name}` : ""}. Kamu menggunakan Key Assistant
            sebagai apa?
          </p>
        </div>

        <RoleChoiceCards
          role={role}
          onSelect={(next) => {
            setRole(next)
            setError("")
          }}
        />

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

  if (step === "role") {
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
          <h1 className="mt-4 text-4xl">Buat akun Key Assistant</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftar gratis. Pilih dulu: Owner atau Klien, lalu isi data akun.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <GoogleAuthButton
            mode="daftar"
            nextPath="/pilih-peran"
            onSuccess={(nextUser) => {
              // Tetap di /daftar — halaman ini menampilkan pilihan peran untuk akun baru.
              if (nextUser.roleChosen === false || needsOnboarding(nextUser)) {
                router.replace("/daftar")
                return
              }
              router.replace(homePathForUser(nextUser))
            }}
          />
          <p className="text-center text-xs text-muted-foreground">
            Setelah Google, pilih di halaman yang sama: bisnis atau mencari jasa.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          atau daftar dengan email
          <span className="h-px flex-1 bg-border" />
        </div>

        <div>
          <p className="text-sm font-medium">Kamu menggunakan Key Assistant sebagai apa?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih dulu, lalu isi nama, email, dan kata sandi.
          </p>
        </div>

        <RoleChoiceCards
          role={role}
          onSelect={(next) => {
            setRole(next)
            setError("")
          }}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="button"
          className={cn(buttonVariants(), "h-11")}
          disabled={!role}
          onClick={() => {
            if (!role) {
              setError("Pilih salah satu opsi di atas.")
              return
            }
            setError("")
            setStep("form")
          }}
        >
          Lanjutkan
        </button>

        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-4 py-10">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke beranda
          </Link>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setStep("role")}
          >
            Ganti pilihan
          </button>
        </div>
        <Link href="/" className="font-display text-2xl">
          Key Assistant
        </Link>
        <h1 className="mt-4 text-4xl">Buat akun kamu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {role === "client"
            ? "Akun klien untuk mengatur acara dan memilih banyak vendor."
            : "Akun owner untuk mengelola bisnis beauty, wedding & event."}
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
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
            {role === "owner" ? "Coba gratis 14 hari" : "Gratis untuk mengatur acara"}
          </p>
        </form>
      </div>
    </div>
  )
}
