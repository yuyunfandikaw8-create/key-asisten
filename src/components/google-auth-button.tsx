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

export function GoogleAuthButton({
  mode,
  onSuccess,
  className,
}: {
  mode: "masuk" | "daftar"
  onSuccess: (user: AuthUser) => void
  className?: string
}) {
  const { continueWithGoogle } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  function pick(choice: GoogleChoice) {
    setError("")
    const result = continueWithGoogle(choice)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    onSuccess(result.user)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("h-10 w-full bg-white", className)}
        onClick={() => setOpen(true)}
      >
        <GoogleMark className="size-4" />
        {mode === "masuk" ? "Lanjutkan dengan Google" : "Daftar dengan Google"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="gap-1 border-b px-5 py-4 text-left">
            <div className="flex items-center gap-2">
              <GoogleMark className="size-5" />
              <DialogTitle className="text-base font-medium">Pilih akun</DialogTitle>
            </div>
            <DialogDescription>
              {mode === "masuk"
                ? "Masuk ke Riasaja dengan akun Gmail."
                : "Daftar studio Riasaja dengan akun Gmail."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid">
            {GOOGLE_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => pick(choice)}
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
            <button
              type="button"
              className="flex items-center gap-3 border-t px-5 py-3 text-left text-sm text-muted-foreground transition hover:bg-muted/70"
              onClick={() =>
                setError(
                  "Tambah akun Google asli menyusul setelah Client ID / Supabase Google OAuth diisi."
                )
              }
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-lg">
                +
              </span>
              Pakai akun Google lain
            </button>
          </div>

          {error ? <p className="border-t px-5 py-3 text-sm text-destructive">{error}</p> : null}

          <p className="border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
            Demo menampilkan pilihan Gmail di browser ini. OAuth Google penuh bisa diaktifkan dengan
            `NEXT_PUBLIC_GOOGLE_CLIENT_ID` atau Supabase Auth.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
