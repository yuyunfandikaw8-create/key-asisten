import { Suspense } from "react"

import { JadwalBoard } from "@/components/jadwal-board"
import { StudioLoading } from "@/components/studio-bits"

export default function JadwalPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <JadwalBoard />
    </Suspense>
  )
}
