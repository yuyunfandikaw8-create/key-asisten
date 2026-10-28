"use client"

import Link from "next/link"
import { CalendarHeart, Heart, Search } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import {
  categoryById,
  CLIENT_BOOKING_STATUS_LABEL,
  partnerById,
} from "@/lib/client-workspace"
import { cn } from "@/lib/utils"

export default function ClientHomePage() {
  const { ready: authReady, user } = useAuth()
  const { ready, activeEvent, workspace } = useClientWorkspace()

  if (!authReady || !ready || !user) return <StudioLoading />

  const filledSlots =
    activeEvent?.slots.filter((slot) => Boolean(slot.partnerId)) ?? []

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Beranda klien
        </p>
        <h1 className="mt-2 text-4xl">Halo, {user.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atur kebutuhan acara dan pilih beberapa vendor sekaligus — MUA, dekor,
          fotografer, dan lainnya dalam satu tempat.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        {activeEvent ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Acara aktif</p>
              <h2 className="mt-1 font-display text-3xl">{activeEvent.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeEvent.date
                  ? new Date(`${activeEvent.date}T12:00:00`).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Tanggal belum diisi"}{" "}
                · {activeEvent.location || activeEvent.city}
              </p>
            </div>
            {filledSlots.length ? (
              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Kebutuhan</th>
                      <th className="px-3 py-2.5 font-medium">Vendor</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filledSlots.map((slot) => {
                      const category = categoryById(slot.needId)
                      const partner = slot.partnerId
                        ? partnerById(slot.partnerId)
                        : null
                      return (
                        <tr
                          key={slot.needId}
                          className="border-t border-foreground/10 bg-background"
                        >
                          <td className="px-3 py-2.5">
                            {category?.emoji} {category?.label}
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            {partner?.name ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {CLIENT_BOOKING_STATUS_LABEL[slot.status]}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Belum ada vendor di acara ini. Cari vendor lalu masukkan ke Pilihan Saya
                atau langsung ke Acara.
              </p>
            )}
            <Link
              href="/klien/acara"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 w-fit")}
            >
              <CalendarHeart className="size-4" />
              Kelola acara
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl">Mulai dari acara</h2>
            <p className="text-sm text-muted-foreground">
              Buat acara dulu — misalnya Pernikahan — lalu isi vendor per kebutuhan.
            </p>
            <Link href="/klien/acara" className={cn(buttonVariants(), "h-10 w-fit")}>
              Buat acara pertama
            </Link>
          </>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/klien/cari"
          className="grid gap-2 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition hover:bg-muted/30"
        >
          <Search className="size-5 text-primary" />
          <p className="font-medium">Cari Vendor</p>
          <p className="text-sm text-muted-foreground">
            MUA, Hair & Hijab, Decoration, Attire, Photo, Video, Content Creator.
          </p>
        </Link>
        <Link
          href="/klien/pilihan"
          className="grid gap-2 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition hover:bg-muted/30"
        >
          <Heart className="size-5 text-primary" />
          <p className="font-medium">Pilihan Saya</p>
          <p className="text-sm text-muted-foreground">
            {workspace.shortlist.length
              ? `${workspace.shortlist.length} vendor tersimpan untuk dibandingkan.`
              : "Simpan beberapa kandidat vendor sebelum booking."}
          </p>
        </Link>
      </div>
    </div>
  )
}
