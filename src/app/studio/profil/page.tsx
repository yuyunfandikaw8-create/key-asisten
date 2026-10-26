"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { BusinessProfileEditor } from "@/components/business-profile-editor"
import { StudioLoading } from "@/components/studio-bits"
import { useAuth } from "@/components/auth-provider"
import { useStudio } from "@/components/studio-provider"
import { buttonVariants } from "@/components/ui/button"
import { paymentMethodLabel } from "@/lib/auth"
import { studioBrand } from "@/lib/studio-brand"
import { cn } from "@/lib/utils"

export default function StudioProfilPage() {
  const { ready: authReady, user } = useAuth()
  const { ready, viewMode } = useStudio()

  if (!ready || !authReady) return <StudioLoading />

  const brand = studioBrand(user, { demo: viewMode === "demo" })
  const methods = brand.payment.methods

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <Link
          href="/studio/menu"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Menu
        </Link>
        <h1 className="text-4xl">Identitas & rekening</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detail ini muncul di pricelist dan komunikasi dengan klien
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-lg font-medium">Profil bisnis</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Nama studio, kontak, logo, dan alamat.
        </p>
        <BusinessProfileEditor />
      </div>

      <div id="metode-pembayaran" className="scroll-mt-24 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Metode pembayaran</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Rekening, QRIS, e-wallet, dan tunai untuk invoice klien.
            </p>
          </div>
          <Link
            href="/studio/keuangan"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 shrink-0")}
          >
            Atur di Keuangan
          </Link>
        </div>

        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Metode aktif</dt>
            <dd className="font-medium">
              {methods.length
                ? methods.map((id) => paymentMethodLabel(id)).join(" · ")
                : "Belum diatur"}
            </dd>
          </div>
          {methods.includes("transfer") ? (
            <div>
              <dt className="text-muted-foreground">Transfer Bank</dt>
              <dd className="font-medium">
                {brand.bank || "—"} · {brand.accountName || "—"} · {brand.accountNumber || "—"}
              </dd>
            </div>
          ) : null}
          {methods.includes("qris") ? (
            <div>
              <dt className="text-muted-foreground">QRIS</dt>
              <dd className="font-medium">
                {brand.payment.qrisDataUrl ? "Gambar sudah diunggah" : "Belum ada gambar QRIS"}
              </dd>
            </div>
          ) : null}
          {methods.includes("ewallet") ? (
            <div>
              <dt className="text-muted-foreground">E-Wallet</dt>
              <dd className="font-medium">
                {brand.ewalletName && brand.ewalletNumber
                  ? `${brand.ewalletName} · ${brand.ewalletNumber}`
                  : "Belum lengkap"}
              </dd>
            </div>
          ) : null}
          {methods.includes("cash") ? (
            <div>
              <dt className="text-muted-foreground">Tunai</dt>
              <dd className="font-medium">Diterima</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  )
}
