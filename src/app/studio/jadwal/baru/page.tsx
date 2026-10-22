"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { ScheduleFields } from "@/components/schedule-fields"
import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { attires, packageById, packages, SAMPLE_CHAT } from "@/lib/catalog"
import { dpFor, EVENT_LABEL, formatDate, formatTime, rupiah } from "@/lib/format"
import { conflictsFor } from "@/lib/metrics"
import { parseChat } from "@/lib/parse-chat"
import type { EventType } from "@/lib/types"

const events = Object.keys(EVENT_LABEL) as EventType[]

export default function NewBookingPage() {
  const router = useRouter()
  const { ready, bookings, addBooking } = useStudio()
  const [chat, setChat] = useState("")
  const [found, setFound] = useState<string[]>([])
  const [parseError, setParseError] = useState("")
  const [formError, setFormError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [eventType, setEventType] = useState<EventType>("pengantin")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState("")
  const [packageId, setPackageId] = useState("emas")
  const [attireId, setAttireId] = useState("none")
  const [notes, setNotes] = useState("")

  const selected = packageById(packageId) ?? packages[0]
  const clashes = useMemo(() => {
    if (!date || !time) return []
    return conflictsFor(bookings, {
      date,
      time,
      attireId: attireId === "none" ? null : attireId,
    })
  }, [attireId, bookings, date, time])

  function applyChat(source: string) {
    const parsed = parseChat(source)
    if (!parsed.found.length) {
      setFound([])
      setParseError("Chat ini belum kebaca. Sertakan nama, tanggal, dan jam.")
      return
    }
    setParseError("")
    setFound(parsed.found)
    if (parsed.clientName) setClientName(parsed.clientName)
    if (parsed.phone) setPhone(parsed.phone)
    if (parsed.eventType) setEventType(parsed.eventType)
    if (parsed.date) setDate(parsed.date)
    if (parsed.time) setTime(parsed.time)
    if (parsed.location) setLocation(parsed.location)
    if (parsed.packageId) setPackageId(parsed.packageId)
  }

  function save() {
    if (!clientName.trim() || !date || !time) {
      setFormError("Nama, tanggal, dan jam wajib diisi.")
      return
    }
    setFormError("")
    if (clashes.length) {
      setConfirmOpen(true)
      return
    }
    commit()
  }

  function commit() {
    const booking = addBooking({
      clientName: clientName.trim(),
      phone: phone.trim(),
      eventType,
      date,
      time,
      location: location.trim() || "Lokasi menyusul",
      packageId: selected.id,
      attireId: attireId === "none" ? null : attireId,
      price: selected.price,
      dp: dpFor(selected.price),
      paid: 0,
      notes: notes.trim(),
      source: chat.trim() ? "chat" : "studio",
      attireReturned: false,
    })
    router.push(`/studio/invoice/${booking.id}`)
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Booking baru</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Tempel chat klien, periksa isiannya, lalu simpan. DP tercatat 30% dan statusnya belum dibayar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <Label htmlFor="chat">Chat WhatsApp</Label>
          <Textarea
            id="chat"
            value={chat}
            onChange={(event) => setChat(event.target.value)}
            placeholder="Tempel chat klien di sini"
            className="min-h-48 bg-background"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => applyChat(chat)} disabled={!chat.trim() || !ready}>
              Baca chat
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setChat(SAMPLE_CHAT)
                applyChat(SAMPLE_CHAT)
              }}
            >
              Isi contoh chat
            </Button>
          </div>
          {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}
          {found.length ? (
            <p className="text-sm text-muted-foreground">Terbaca: {found.join(", ")}.</p>
          ) : null}
        </section>

        <form
          className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="nama">Nama klien</Label>
            <Input id="nama" value={clientName} onChange={(event) => setClientName(event.target.value)} className="h-10 bg-background" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hp">WhatsApp</Label>
            <Input id="hp" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10 bg-background" placeholder="08…" />
          </div>
          <ScheduleFields
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            inputClassName="bg-background"
          />
          <div className="grid gap-1.5">
            <Label>Acara</Label>
            <Select value={eventType} onValueChange={(value) => setEventType((value ?? "pengantin") as EventType)}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue>{(value) => EVENT_LABEL[(value as EventType) ?? "pengantin"]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event} value={event}>
                    {EVENT_LABEL[event]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Paket</Label>
            <Select value={packageId} onValueChange={(value) => setPackageId(value ?? "emas")}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue>
                  {(value) => {
                    const item = packageById(String(value ?? "emas"))
                    return item ? `${item.name} · ${rupiah(item.price)}` : "Pilih paket"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {packages.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {rupiah(item.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">DP {rupiah(dpFor(selected.price))}</p>
          </div>
          <div className="grid gap-1.5">
            <Label>Gaun</Label>
            <Select value={attireId} onValueChange={(value) => setAttireId(value ?? "none")}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue>
                  {(value) =>
                    value === "none" || !value
                      ? "Tidak memakai gaun studio"
                      : (attires.find((item) => item.id === value)?.name ?? "Pilih gaun")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak memakai gaun studio</SelectItem>
                {attires.map((attire) => (
                  <SelectItem key={attire.id} value={attire.id}>
                    {attire.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lokasi">Lokasi</Label>
            <Input id="lokasi" value={location} onChange={(event) => setLocation(event.target.value)} className="h-10 bg-background" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea id="catatan" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20 bg-background" />
          </div>
          {clashes.length ? (
            <p className="text-sm text-destructive">
              Bentrok dengan {clashes.map((item) => item.clientName).join(", ")} pada {formatDate(date)} pukul {formatTime(time)}.
            </p>
          ) : null}
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <Button type="submit" disabled={!ready} className="h-10">
            Simpan jadwal
          </Button>
        </form>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwal ini bentrok</DialogTitle>
            <DialogDescription>
              {clashes.map((item) => item.clientName).join(", ")} sudah ada di tanggal yang sama. Simpan hanya kalau klien ini memang disengaja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Kembali
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                commit()
              }}
            >
              Simpan tetap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
