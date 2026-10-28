import type { Metadata } from "next"
import { Suspense } from "react"

import { Pricelist } from "@/components/pricelist"
import { studio } from "@/lib/catalog"

type Props = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: `Booking ${studio.name}`,
  description: `Ajukan booking singkat ke ${studio.name}. Owner mengonfirmasi lewat WhatsApp.`,
}

async function PricelistFromParams({ params }: Props) {
  const { slug } = await params
  return <Pricelist slug={slug} />
}

export default function PricelistPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          Memuat link booking…
        </main>
      }
    >
      <PricelistFromParams params={params} />
    </Suspense>
  )
}
