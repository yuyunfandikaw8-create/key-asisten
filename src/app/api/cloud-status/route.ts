import { connection } from "next/server"
import { NextResponse } from "next/server"

import { checkCloudSchema } from "@/lib/cloud-sync"

/** GET /api/cloud-status — cek apakah tabel Supabase sudah siap. */
export async function GET() {
  await connection()
  const status = await checkCloudSchema()
  const missing = Object.entries(status.tables)
    .filter(([, value]) => value === "missing")
    .map(([name]) => name)

  return NextResponse.json({
    ok: status.configured && missing.length === 0,
    ...status,
    missing,
    hint:
      missing.length > 0
        ? "Jalankan supabase/schema.sql di Supabase SQL Editor, lalu refresh endpoint ini."
        : status.configured
          ? "Skema cloud siap."
          : "Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  })
}
