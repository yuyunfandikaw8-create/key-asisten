"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { useClientWorkspace } from "@/components/client-provider"
import { StudioLoading } from "@/components/studio-bits"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  categoryById,
  CLIENT_BOOKING_STATUS_LABEL,
  partnerById,
  type ClientBookingStatus,
} from "@/lib/client-workspace"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = Object.entries(CLIENT_BOOKING_STATUS_LABEL) as [
  ClientBookingStatus,
  string,
][]

export default function ClientEventsPage() {
  const { ready: authReady, user } = useAuth()
  const {
    ready,
    workspace,
    activeEvent,
    addEvent,
    setActiveEvent,
    setSlotStatus,
  } = useClientWorkspace()
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState("")

  if (!authReady || !ready || !user) return <StudioLoading />

  function createEvent() {
    if (!title.trim()) {
      setError("Isi nama acara.")
      return
    }
    addEvent({
      title: title.trim(),
      date,
      location: location.trim() || user!.city || "Lokasi menyusul",
      city: user!.city || "Bandung",
    })
    setTitle("")
    setDate("")
    setLocation("")
    setError("")
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-4xl">Acara Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acara jadi pusat akun klien — satu acara, banyak vendor dari berbagai kategori.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <p className="font-medium">Buat acara baru</p>
        <div className="grid gap-1.5">
          <Label htmlFor="event-title">Nama acara</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Pernikahan Yogi & Dina"
            className="h-11 bg-background"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="event-date">Tanggal</Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 bg-background"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="event-location">Lokasi</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Surabaya"
              className="h-11 bg-background"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="button"
          className={cn(buttonVariants(), "h-11 w-fit")}
          onClick={createEvent}
        >
          Simpan acara
        </button>
      </section>

      {workspace.events.length ? (
        <div className="flex flex-wrap gap-2">
          {workspace.events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setActiveEvent(event.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                activeEvent?.id === event.id
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-foreground/10 hover:bg-muted/50"
              )}
            >
              {event.title}
            </button>
          ))}
        </div>
      ) : null}

      {activeEvent ? (
        <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h2 className="font-display text-3xl">{activeEvent.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeEvent.date
                ? new Date(`${activeEvent.date}T12:00:00`).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Tanggal menyusul"}{" "}
              · {activeEvent.location || activeEvent.city}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Kebutuhan</th>
                  <th className="px-3 py-2.5 font-medium">Vendor</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeEvent.slots.map((slot) => {
                  const category = categoryById(slot.needId)
                  const partner = slot.partnerId ? partnerById(slot.partnerId) : null
                  return (
                    <tr
                      key={slot.needId}
                      className="border-t border-foreground/10 bg-background"
                    >
                      <td className="px-3 py-2.5">
                        {category?.emoji} {category?.label}
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        {partner?.name ?? "Belum dipilih"}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={slot.status}
                          onChange={(event) =>
                            setSlotStatus(
                              activeEvent.id,
                              slot.needId,
                              event.target.value as ClientBookingStatus
                            )
                          }
                          className="h-9 rounded-lg border bg-background px-2 text-sm"
                        >
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
