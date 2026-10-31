"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Download } from "lucide-react"

import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  CLIENT_INVOICE_PAYMENT_LABEL,
  downloadClientInvoicePdf,
  findClientInvoice,
  type ClientInvoicePaymentStatus,
} from "@/lib/client-invoice"
import { CLIENT_BOOKING_STATUS_LABEL } from "@/lib/client-workspace"
import { formatShortDate, rupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

function paymentTone(status: ClientInvoicePaymentStatus) {
  if (status === "dibayar") return "bg-emerald-50 text-emerald-800 ring-emerald-200"
  if (status === "terlambat") return "bg-red-50 text-red-800 ring-red-200"
  if (status === "menunggu_konfirmasi")
    return "bg-amber-50 text-amber-900 ring-amber-200"
  return "bg-muted/60 text-foreground ring-foreground/10"
}

export default function ClientInvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const { ready, workspace } = useClientWorkspace()
  if (!ready) return <StudioLoading />

  const rawId = typeof params.id === "string" ? params.id : ""
  const invoiceId = decodeURIComponent(rawId)
  const invoice = findClientInvoice(workspace.events, invoiceId)

  if (!invoice) {
    return (
      <div className="grid gap-4">
        <Link
          href="/klien/tagihan"
          className={cn(buttonVariants({ variant: "ghost" }), "h-9 w-fit px-0")}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Tagihan
        </Link>
        <div className="rounded-2xl bg-card p-5 text-sm text-muted-foreground ring-1 ring-foreground/10">
          Tagihan tidak ditemukan atau belum diterbitkan.
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/klien/tagihan"
            className={cn(buttonVariants({ variant: "ghost" }), "mb-2 h-9 w-fit px-0")}
          >
            <ArrowLeft className="size-4" />
            Kembali ke Tagihan
          </Link>
          <h1 className="text-4xl">Detail Tagihan</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoice.number}</p>
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

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nama Vendor</dt>
            <dd className="mt-0.5 font-medium">
              {invoice.categoryEmoji} {invoice.vendorName}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nama acara</dt>
            <dd className="mt-0.5 font-medium">{invoice.eventTitle}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nomor tagihan</dt>
            <dd className="mt-0.5 font-medium">{invoice.number}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kategori</dt>
            <dd className="mt-0.5 font-medium">{invoice.categoryLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tanggal penerbitan</dt>
            <dd className="mt-0.5 font-medium">{formatShortDate(invoice.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tanggal jatuh tempo</dt>
            <dd className="mt-0.5 font-medium">{formatShortDate(invoice.dueAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status pembayaran</dt>
            <dd className="mt-0.5 font-medium">
              {CLIENT_INVOICE_PAYMENT_LABEL[invoice.paymentStatus]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status pemesanan</dt>
            <dd className="mt-0.5 font-medium">
              {CLIENT_BOOKING_STATUS_LABEL[invoice.bookingStatus]}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Total tagihan</dt>
            <dd className="mt-1 text-2xl font-medium">{rupiah(invoice.total)}</dd>
          </div>
        </dl>

        <button
          type="button"
          className={cn(buttonVariants(), "h-11 w-fit")}
          onClick={() => downloadClientInvoicePdf(invoice)}
        >
          <Download className="size-4" />
          Unduh Tagihan
        </button>
      </section>
    </div>
  )
}
