import { formatPlanPrice } from "@/lib/trial"
import { cn } from "@/lib/utils"

/** Tampilkan harga jual + harga coret (bila ada). */
export function PlanPrice({
  price,
  compareAt,
  periodLabel,
  className,
  size = "md",
}: {
  price: number | null | undefined
  compareAt?: number | null
  periodLabel?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sale = typeof price === "number" && price > 0 ? price : null
  const was =
    typeof compareAt === "number" &&
    compareAt > 0 &&
    sale != null &&
    compareAt > sale
      ? compareAt
      : null

  const saleClass =
    size === "lg"
      ? "text-2xl font-semibold"
      : size === "sm"
        ? "text-sm font-semibold"
        : "text-base font-semibold"
  const wasClass =
    size === "lg"
      ? "text-sm"
      : size === "sm"
        ? "text-xs"
        : "text-sm"

  if (!sale) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Belum ditetapkan
      </span>
    )
  }

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {was ? (
        <span className={cn("text-muted-foreground line-through", wasClass)}>
          {formatPlanPrice(was)}
        </span>
      ) : null}
      <span className={saleClass}>
        {formatPlanPrice(sale)}
        {periodLabel ? (
          <span className="ml-0.5 text-sm font-normal text-muted-foreground">
            {periodLabel}
          </span>
        ) : null}
      </span>
    </span>
  )
}
