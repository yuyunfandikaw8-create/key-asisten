"use client"

import { useEffect, useState } from "react"

import { useAdminSettings } from "@/components/admin-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_QRIS_IMAGE,
  type AdminPayMethod,
  type AdminSettings,
} from "@/lib/admin-settings"
import { cn } from "@/lib/utils"

const PAY_OPTIONS: { id: AdminPayMethod; label: string; hint: string }[] = [
  {
    id: "qris",
    label: "QRIS",
    hint: "Scan kode resmi Key Assistant (GoPay merchant).",
  },
  {
    id: "transfer",
    label: "Transfer bank",
    hint: "Rekening manual untuk transfer.",
  },
  {
    id: "va",
    label: "Virtual Account",
    hint: "Nomor VA bank (jika sudah tersedia).",
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    hint: "Nomor GoPay / OVO / Dana manual.",
  },
]

export default function AdminMetodeBayarPage() {
  const { ready, settings, saveSettings } = useAdminSettings()
  const [draft, setDraft] = useState<AdminSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  if (!ready) return <StudioLoading />

  function toggleMethod(id: AdminPayMethod) {
    setDraft((current) => {
      const has = current.enabledPayMethods.includes(id)
      const enabledPayMethods = has
        ? current.enabledPayMethods.filter((item) => item !== id)
        : [...current.enabledPayMethods, id]
      return { ...current, enabledPayMethods }
    })
    setSaved(false)
  }

  function save() {
    setError("")
    if (!draft.enabledPayMethods.length) {
      setError("Aktifkan minimal satu metode pembayaran.")
      return
    }
    if (draft.enabledPayMethods.includes("qris")) {
      if (!draft.paymentDetails.qris.merchantName.trim()) {
        setError("Nama merchant QRIS wajib diisi.")
        return
      }
      if (!draft.paymentDetails.qris.nmid.trim()) {
        setError("NMID QRIS wajib diisi.")
        return
      }
      if (!draft.paymentDetails.qris.imageUrl.trim()) {
        setError("URL / path gambar QRIS wajib diisi.")
        return
      }
    }
    if (draft.enabledPayMethods.includes("transfer")) {
      if (
        !draft.paymentDetails.transfer.bankName.trim() ||
        !draft.paymentDetails.transfer.accountNumber.trim()
      ) {
        setError("Untuk transfer, isi nama bank dan nomor rekening.")
        return
      }
    }
    saveSettings(draft)
    setSaved(true)
  }

  const qris = draft.paymentDetails.qris

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Metode Pembayaran</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atur cara Owner membayar langganan ke Key Assistant. QRIS resmi
          merchant KEY ASSISTANT sudah terpasang — lengkapi detail lain bila
          perlu.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Metode yang ditawarkan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hanya metode aktif yang muncul di halaman /langganan Owner.
          </p>
        </div>
        <div className="grid gap-2">
          {PAY_OPTIONS.map((method) => (
            <label
              key={method.id}
              className="flex items-start gap-3 rounded-xl px-3 py-3 text-sm ring-1 ring-foreground/10"
            >
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-primary"
                checked={draft.enabledPayMethods.includes(method.id)}
                onChange={() => toggleMethod(method.id)}
              />
              <span>
                <span className="font-medium">{method.label}</span>
                <span className="mt-0.5 block text-muted-foreground">
                  {method.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">QRIS Key Assistant</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Data merchant resmi. Owner akan melihat QR ini saat memilih bayar
            QRIS.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qris.imageUrl || DEFAULT_QRIS_IMAGE}
            alt="QRIS KEY ASSISTANT"
            className="mx-auto max-h-[420px] w-full object-contain bg-white"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="qris-merchant">Nama merchant</Label>
            <Input
              id="qris-merchant"
              className="h-10"
              value={qris.merchantName}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    qris: {
                      ...current.paymentDetails.qris,
                      merchantName: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qris-nmid">NMID</Label>
            <Input
              id="qris-nmid"
              className="h-10 font-mono"
              value={qris.nmid}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    qris: {
                      ...current.paymentDetails.qris,
                      nmid: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qris-terminal">Terminal / Point ID</Label>
            <Input
              id="qris-terminal"
              className="h-10"
              value={qris.terminalId}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    qris: {
                      ...current.paymentDetails.qris,
                      terminalId: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qris-printer">Printer ID</Label>
            <Input
              id="qris-printer"
              className="h-10"
              value={qris.printerId}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    qris: {
                      ...current.paymentDetails.qris,
                      printerId: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="qris-image">Path / URL gambar QRIS</Label>
          <Input
            id="qris-image"
            className="h-10 font-mono text-sm"
            value={qris.imageUrl}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                paymentDetails: {
                  ...current.paymentDetails,
                  qris: {
                    ...current.paymentDetails.qris,
                    imageUrl: event.target.value,
                  },
                },
              }))
              setSaved(false)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Default: {DEFAULT_QRIS_IMAGE}
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="qris-instructions">Instruksi untuk Owner</Label>
          <Textarea
            id="qris-instructions"
            rows={6}
            value={qris.instructions}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                paymentDetails: {
                  ...current.paymentDetails,
                  qris: {
                    ...current.paymentDetails.qris,
                    instructions: event.target.value,
                  },
                },
              }))
              setSaved(false)
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Transfer bank</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Opsional — isi jika transfer manual diaktifkan.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tf-bank">Bank</Label>
            <Input
              id="tf-bank"
              className="h-10"
              placeholder="Contoh: BCA"
              value={draft.paymentDetails.transfer.bankName}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    transfer: {
                      ...current.paymentDetails.transfer,
                      bankName: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tf-number">Nomor rekening</Label>
            <Input
              id="tf-number"
              className="h-10"
              value={draft.paymentDetails.transfer.accountNumber}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    transfer: {
                      ...current.paymentDetails.transfer,
                      accountNumber: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tf-holder">Atas nama</Label>
            <Input
              id="tf-holder"
              className="h-10"
              value={draft.paymentDetails.transfer.accountHolder}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    transfer: {
                      ...current.paymentDetails.transfer,
                      accountHolder: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tf-instructions">Instruksi transfer</Label>
          <Textarea
            id="tf-instructions"
            rows={4}
            value={draft.paymentDetails.transfer.instructions}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                paymentDetails: {
                  ...current.paymentDetails,
                  transfer: {
                    ...current.paymentDetails.transfer,
                    instructions: event.target.value,
                  },
                },
              }))
              setSaved(false)
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Virtual Account & E-Wallet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi jika metode ini aktif. Boleh dikosongkan sementara.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="va-bank">Bank VA</Label>
            <Input
              id="va-bank"
              className="h-10"
              value={draft.paymentDetails.va.bankName}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    va: {
                      ...current.paymentDetails.va,
                      bankName: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="va-number">Nomor VA</Label>
            <Input
              id="va-number"
              className="h-10"
              value={draft.paymentDetails.va.vaNumber}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    va: {
                      ...current.paymentDetails.va,
                      vaNumber: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ew-provider">Provider e-wallet</Label>
            <Input
              id="ew-provider"
              className="h-10"
              value={draft.paymentDetails.ewallet.provider}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    ewallet: {
                      ...current.paymentDetails.ewallet,
                      provider: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ew-number">Nomor e-wallet</Label>
            <Input
              id="ew-number"
              className="h-10"
              value={draft.paymentDetails.ewallet.accountNumber}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    ewallet: {
                      ...current.paymentDetails.ewallet,
                      accountNumber: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="ew-name">Nama akun e-wallet</Label>
            <Input
              id="ew-name"
              className="h-10"
              value={draft.paymentDetails.ewallet.accountName}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  paymentDetails: {
                    ...current.paymentDetails,
                    ewallet: {
                      ...current.paymentDetails.ewallet,
                      accountName: event.target.value,
                    },
                  },
                }))
                setSaved(false)
              }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-2xl">Kontak support & catatan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Support bisa ditampilkan ke Owner. Catatan admin hanya untuk kamu.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="support-wa">WhatsApp support</Label>
            <Input
              id="support-wa"
              className="h-10"
              placeholder="08xxxxxxxxxx"
              value={draft.supportWhatsapp}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  supportWhatsapp: event.target.value,
                }))
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="support-email">Email support</Label>
            <Input
              id="support-email"
              className="h-10"
              type="email"
              value={draft.supportEmail}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  supportEmail: event.target.value,
                }))
                setSaved(false)
              }}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="server-notice">Pengumuman di /langganan</Label>
          <Textarea
            id="server-notice"
            rows={3}
            value={draft.serverNotice}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                serverNotice: event.target.value,
              }))
              setSaved(false)
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="admin-notes">Catatan internal admin</Label>
          <Textarea
            id="admin-notes"
            rows={3}
            placeholder="Hanya terlihat di menu server."
            value={draft.adminNotes}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                adminNotes: event.target.value,
              }))
              setSaved(false)
            }}
          />
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-primary">Metode pembayaran disimpan.</p>
      ) : null}

      <button
        type="button"
        className={cn(buttonVariants(), "h-11 w-fit")}
        onClick={save}
      >
        Simpan metode pembayaran
      </button>
    </div>
  )
}
