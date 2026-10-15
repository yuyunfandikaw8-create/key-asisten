import type { Metadata } from "next"
import { Suspense } from "react"

import { Pricelist } from "@/components/pricelist"
import { studio } from "@/lib/catalog"

type Props = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: `Pricelist ${studio.name}`,
  description: studio.bio,
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
          Memuat pricelist…
        </main>
      }
    >
      <PricelistFromParams params={params} />
    </Suspense>
  )
}
