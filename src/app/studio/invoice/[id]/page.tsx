import { Suspense } from "react"

import { InvoiceDetail } from "@/components/invoice-detail"
import { StudioLoading } from "@/components/studio-bits"

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <InvoiceDetail />
    </Suspense>
  )
}
