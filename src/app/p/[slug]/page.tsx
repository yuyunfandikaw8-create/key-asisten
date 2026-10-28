import type { Metadata } from "next"
import { Suspense } from "react"

import { PublicVendorProfile } from "@/components/public-vendor-profile"
import { studio } from "@/lib/catalog"

type Props = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: `Profil Publik · ${studio.name}`,
  description: `Lihat portofolio, layanan, dan ajukan booking ke ${studio.name}.`,
}

async function ProfileFromParams({ params }: Props) {
  const { slug } = await params
  return <PublicVendorProfile slug={slug} />
}

export default function PublicProfilePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-sm text-muted-foreground">
          Memuat profil publik…
        </main>
      }
    >
      <ProfileFromParams params={params} />
    </Suspense>
  )
}
