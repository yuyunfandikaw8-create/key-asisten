import type { Metadata } from "next"
import { Suspense } from "react"

import { PublicBookingFlow } from "@/components/public-booking"
import { studio } from "@/lib/catalog"

type Props = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: `Ajukan Booking · ${studio.name}`,
  description: `Ajukan booking singkat ke ${studio.name}. Owner mengonfirmasi lewat WhatsApp.`,
}

async function BookingFromParams({ params }: Props) {
  const { slug } = await params
  return <PublicBookingFlow slug={slug} />
}

export default function PublicBookingPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-sm text-muted-foreground">
          Memuat form ajukan booking…
        </main>
      }
    >
      <BookingFromParams params={params} />
    </Suspense>
  )
}
