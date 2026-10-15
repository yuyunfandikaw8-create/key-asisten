import { Badge } from "@/components/ui/badge"
import { PAYMENT_LABEL } from "@/lib/format"
import type { PaymentStatus } from "@/lib/types"

const style: Record<PaymentStatus, string> = {
  belum_dp: "bg-accent text-accent-foreground",
  belum_lunas: "bg-secondary text-secondary-foreground",
  lunas: "bg-primary text-primary-foreground",
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="secondary" className={style[status]}>
      {PAYMENT_LABEL[status]}
    </Badge>
  )
}

export function StudioLoading() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">Memuat meja kerja studio…</p>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
