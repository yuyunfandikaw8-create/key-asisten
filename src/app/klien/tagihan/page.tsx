"use client"

import Link from "next/link"
import { Download, Eye } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  CLIENT_INVOICE_PAYMENT_LABEL,
  downloadClientInvoicePdf,
  listClientInvoices,
  type ClientInvoicePaymentStatus,
} from "@/lib/client-invoice"
import { formatShortDate, rupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

function paymentTone(status: ClientInvoicePaymentStatus) {
  if (status === "dibayar") return "bg-emerald-50 text-emerald-800 ring-emerald-200"
  if (status === "terlambat") return "bg-red-50 text-red-800 ring-red-200"
  if (status === "menunggu_konfirmasi")
    return "bg-amber-50 text-amber-900 ring-amber-200"
  return "bg-muted/60 text-foreground ring-foreground/10"
}

export default function ClientInvoicesPage() {
  const { ready: authReady, user } = useAuth()
  const { ready, workspace } = useClientWorkspace()
  if (!authReady || !ready || !user) return <StudioLoading />

  const client = { name: user.name, phone: user.phone, city: user.city }
  const invoices = listClientInvoices(workspace.events, client)

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Tagihan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lihat dan kelola seluruh tagihan dari Vendor yang terlibat dalam acara
          Anda.
        </p>
      </div>

      {!invoices.length ? (
        <div className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Belum ada tagihan untuk saat ini. Tagihan akan ditampilkan setelah
            Vendor menerbitkan tagihan untuk pemesanan Anda.
          </p>
          <Link href="/klien/booking" className={cn(buttonVariants(), "h-10 w-fit")}>
            Lihat booking
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {invoices.map((invoice) => (
            <article
              key={invoice.id}
              className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Vendor</p>
                  <p className="font-medium">
                    {invoice.categoryEmoji} {invoice.vendorName}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                    paymentTone(invoice.paymentStatus)
                  )}
                >
                  {CLIENT_INVOICE_PAYMENT_LABEL[invoice.paymentStatus]}
                </span>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Nama acara</dt>
                  <dd className="font-medium">{invoice.eventTitle}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nomor tagihan</dt>
                  <dd className="font-medium">{invoice.number}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tanggal penerbitan</dt>
                  <dd className="font-medium">{formatShortDate(invoice.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tanggal jatuh tempo</dt>
                  <dd className="font-medium">{formatShortDate(invoice.dueAt)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Total tagihan</dt>
                  <dd className="text-lg font-medium">{rupiah(invoice.total)}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/klien/tagihan/${encodeURIComponent(invoice.id)}`}
                  className={cn(buttonVariants({ variant: "outline" }), "h-10")}
                >
                  <Eye className="size-4" />
                  Lihat Detail
                </Link>
                <button
                  type="button"
                  className={cn(buttonVariants(), "h-10")}
                  onClick={() => downloadClientInvoicePdf(invoice)}
                >
                  <Download className="size-4" />
                  Unduh Tagihan
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
