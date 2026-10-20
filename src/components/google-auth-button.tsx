"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { GOOGLE_CHOICES, type AuthUser, type GoogleChoice } from "@/lib/auth"
import { cn } from "@/lib/utils"

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3a7.2 7.2 0 0 1-10.78-3.79H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.3 6.6l4 3.1A7.18 7.18 0 0 1 12 4.75Z"
      />
    </svg>
  )
}

function choiceFromEmail(email: string): GoogleChoice {
  const normalized = email.trim().toLowerCase()
  const local = normalized.split("@")[0] || "Pengguna"
  const name = local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
  return {
    id: `gmail-custom-${normalized}`,
    name,
    email: normalized,
    city: "Bandung",
    studioName: name,
    phone: "",
    initial: name.charAt(0).toUpperCase() || "G",
    tone: "bg-[oklch(0.55_0.12_25)] text-white",
  }
}

export function GoogleAuthButton({
  mode,
  nextPath = "/studio",
  onSuccess,
  className,
}: {
  mode: "masuk" | "daftar"
  nextPath?: string
  onSuccess: (user: AuthUser) => void
  className?: string
}) {
  const { continueWithGoogle, startGoogleOAuth, googleEnabled } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [customEmail, setCustomEmail] = useState("")

  async function pick(choice: GoogleChoice) {
    setError("")
    setPending(true)
    const result = await continueWithGoogle(choice)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    onSuccess(result.user)
  }

  async function openPicker() {
    setError("")
    if (googleEnabled) {
      setPending(true)
      const result = await startGoogleOAuth(nextPath)
      setPending(false)
      if (result.ok) {
        onSuccess(result.user)
        return
      }
      if (result.error.includes("Mengalihkan")) return
      // OAuth gagal → tetap tampilkan pilihan lokal.
      setError(result.error)
    }
    setOpen(true)
  }

  async function continueCustomEmail() {
    const email = customEmail.trim().toLowerCase()
    if (!email.includes("@") || !email.includes(".")) {
      setError("Masukkan alamat Gmail yang valid.")
      return
    }
    await pick(choiceFromEmail(email))
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("h-10 w-full bg-white", className)}
        onClick={() => void openPicker()}
        disabled={pending}
      >
        <GoogleMark className="size-4" />
        {pending
          ? "Menyiapkan Google…"
          : mode === "masuk"
            ? "Lanjutkan dengan Google"
            : "Daftar dengan Google"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="gap-1 border-b px-5 py-4 text-left">
            <div className="flex items-center gap-2">
              <GoogleMark className="size-5" />
              <DialogTitle className="text-base font-medium">Pilih akun</DialogTitle>
            </div>
            <DialogDescription>
              {googleEnabled
                ? "Pilih Gmail untuk masuk ke Key Assistant."
                : "Google OAuth di Supabase belum aktif. Pilih akun contoh, atau masukkan Gmail kamu untuk lanjut di browser ini."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid">
            {GOOGLE_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => void pick(choice)}
                className="flex items-center gap-3 px-5 py-3 text-left transition hover:bg-muted/70"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    choice.tone
                  )}
                >
                  {choice.initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{choice.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{choice.email}</span>
                  <span className="block text-xs text-muted-foreground">
                    {choice.studioName} · {choice.city}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-2 border-t px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Atau lanjut dengan Gmail kamu
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                value={customEmail}
                onChange={(event) => setCustomEmail(event.target.value)}
                placeholder="nama@gmail.com"
                className="h-10"
              />
              <Button
                type="button"
                className="h-10 shrink-0"
                disabled={pending}
                onClick={() => void continueCustomEmail()}
              >
                Lanjut
              </Button>
            </div>
          </div>

          {error ? <p className="border-t px-5 py-3 text-sm text-destructive">{error}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
