"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { useStudio } from "@/components/studio-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { attires, packageById, packages, studio } from "@/lib/catalog"
import { dpFor, EVENT_LABEL, formatDate, rupiah, waLink } from "@/lib/format"
import { attireStatus, conflictsFor } from "@/lib/metrics"
import { comboTotal, partnerById, TRADE_LABEL } from "@/lib/partners"
import type { EventType } from "@/lib/types"

function ComboSection() {
  const { ready, combos, addBooking } = useStudio()
  const published = combos.filter((combo) => combo.published)
  const [comboId, setComboId] = useState(published[0]?.id ?? "")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [date, setDate] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState("")
  const selected = published.find((combo) => combo.id === comboId) ?? published[0]

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Memuat kombo…</p>
  }

  if (!published.length) {
    return (
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-3xl">Kombo bersama partner</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Belum ada paket gabungan yang ditampilkan. Studio masih menyusun kerja sama dengan dekor, hairdo, dan sewa baju.
        </p>
      </section>
    )
  }

  const price = selected
    ? comboTotal(packageById(selected.packageId)?.price ?? 0, selected.partnerIds, selected.discount)
    : 0

  return (
    <section className="grid gap-3">
      <h2 className="text-3xl">Kombo bersama partner</h2>
      <p className="text-sm text-muted-foreground">
        Satu harga untuk rias dan partner yang sudah setuju. Jam sementara 08.00, studio yang mengunci.
      </p>
      {published.map((combo) => {
        const pkg = packageById(combo.packageId)
        const total = comboTotal(pkg?.price ?? 0, combo.partnerIds, combo.discount)
        return (
          <article key={combo.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl">{combo.name}</h3>
              <p className="font-medium">{rupiah(total)}</p>
            </div>
            <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
              <li>Rias {pkg?.name}</li>
              {combo.partnerIds.map((id) => {
                const partner = partnerById(id)
                return partner ? (
                  <li key={id}>
                    {TRADE_LABEL[partner.trade]} · {partner.name}
                  </li>
                ) : null
              })}
            </ul>
            {combo.note ? <p className="mt-2 text-sm">{combo.note}</p> : null}
          </article>
        )
      })}
      {sent ? (
        <p className="rounded-xl bg-accent px-4 py-3 text-sm">{sent}</p>
      ) : (
        <form
          className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          onSubmit={(event) => {
            event.preventDefault()
            if (!ready || !selected) return
            if (!name.trim() || !phone.trim() || !date) {
              setError("Nama, WhatsApp, dan tanggal wajib diisi.")
              return
            }
            addBooking({
              clientName: name.trim(),
              phone: phone.trim(),
              eventType: "pengantin",
              date,
              time: "08:00",
              location: "Dari pricelist kombo, lokasi menyusul",
              packageId: selected.packageId,
              attireId: null,
              price,
              dp: dpFor(price),
              paid: 0,
              notes: `Kombo ${selected.name}`,
              source: "pricelist",
              attireReturned: false,
            })
            setSent(`Pengajuan kombo ${selected.name} untuk ${formatDate(date)} sudah masuk ke studio.`)
            setError("")
          }}
        >
          <h3 className="font-display text-2xl">Ajukan kombo</h3>
          <div className="grid gap-1.5">
            <Label>Kombo</Label>
            <Select value={selected?.id ?? comboId} onValueChange={(value) => setComboId(value ?? published[0].id)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>{() => selected?.name ?? "Pilih kombo"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {published.map((combo) => (
                  <SelectItem key={combo.id} value={combo.id}>
                    {combo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nama-kombo-klien">Nama</Label>
            <Input id="nama-kombo-klien" value={name} onChange={(event) => setName(event.target.value)} className="h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wa-kombo">WhatsApp</Label>
            <Input id="wa-kombo" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10" placeholder="08…" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tanggal-kombo">Tanggal</Label>
            <Input id="tanggal-kombo" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={!ready} className="h-10">
            Kirim pengajuan kombo
          </Button>
        </form>
      )}
    </section>
  )
}

export function Pricelist({ slug }: { slug: string }) {
  const { ready, bookings, addBooking } = useStudio()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [date, setDate] = useState("")
  const [packageId, setPackageId] = useState(packages[0].id)
  const [attireId, setAttireId] = useState("none")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState("")

  const selected = packageById(packageId) ?? packages[0]
  const clashes = useMemo(() => {
    if (!date) return []
    return conflictsFor(bookings, {
      date,
      time: "08:00",
      attireId: attireId === "none" ? null : attireId,
    })
  }, [attireId, bookings, date])

  if (slug !== studio.slug) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 text-center">
        <p className="text-sm text-primary">Pricelist</p>
        <h1 className="mt-2 text-4xl">Studio ini belum punya halaman</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Alamat yang dibuka tidak cocok dengan studio demo. Pricelist yang tersedia milik {studio.name}.
        </p>
        <Link href={`/p/${studio.slug}`} className="mt-6 text-sm font-medium text-primary">
          Buka pricelist {studio.name}
        </Link>
      </main>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="text-sm text-muted-foreground">
            Key Assistant
          </Link>
          <Link href="/studio" className="ml-auto text-sm font-medium">
            Masuk studio
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10">
        <div>
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            {studio.city} · {studio.instagram}
          </p>
          <h1 className="mt-2 text-5xl">{studio.name}</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">{studio.bio}</p>
          <a
            className="mt-4 inline-flex text-sm font-medium text-primary"
            href={waLink(studio.phone, `Halo ${studio.name}, saya ingin tanya jadwal.`)}
          >
            Chat WhatsApp {studio.phone}
          </a>
        </div>

        <section className="grid gap-3">
          <h2 className="text-3xl">Paket</h2>
          {packages.map((item) => (
            <article key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl">{item.name}</h3>
                <p className="font-medium">{rupiah(item.price)}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.blurb}</p>
              <ul className="mt-3 grid gap-1 text-sm">
                {item.includes.map((include) => (
                  <li key={include}>{include}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">DP {rupiah(dpFor(item.price))}</p>
            </article>
          ))}
        </section>

        <ComboSection />

        <section className="grid gap-3">
          <h2 className="text-3xl">Gaun yang bisa ditahan</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {attires.map((attire) => {
              const status = ready ? attireStatus(attire.id, bookings) : null
              return (
                <article key={attire.id} className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
                  <span className="size-14 rounded-xl ring-1 ring-foreground/10" style={{ background: attire.tone }} />
                  <div>
                    <p className="font-medium">{attire.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {attire.category} · {attire.size}
                    </p>
                    <p className="text-xs text-muted-foreground">{status?.label ?? "Memuat status…"}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="text-3xl">Ajukan tanggal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengajuan masuk ke studio sebagai belum DP. Jam sementara 08.00, studio yang mengunci jam akhirnya.
          </p>
          {sent ? (
            <p className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm">{sent}</p>
          ) : (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (!ready) return
                if (!name.trim() || !phone.trim() || !date) {
                  setError("Nama, WhatsApp, dan tanggal wajib diisi.")
                  return
                }
                const eventType: EventType = packageId === "wisuda" ? "wisuda" : packageId === "perak" ? "engagement" : "pengantin"
                addBooking({
                  clientName: name.trim(),
                  phone: phone.trim(),
                  eventType,
                  date,
                  time: "08:00",
                  location: "Dari pricelist, lokasi menyusul",
                  packageId: selected.id,
                  attireId: attireId === "none" ? null : attireId,
                  price: selected.price,
                  dp: dpFor(selected.price),
                  paid: 0,
                  notes: note.trim(),
                  source: "pricelist",
                  attireReturned: false,
                })
                setSent(
                  `Tanggal ${formatDate(date)} untuk ${name.trim()} sudah masuk ke ${studio.name}. Studio akan mengunci jam lewat WhatsApp.`
                )
                setError("")
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="nama-klien">Nama</Label>
                <Input id="nama-klien" value={name} onChange={(event) => setName(event.target.value)} className="h-10" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="wa-klien">WhatsApp</Label>
                <Input id="wa-klien" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10" placeholder="08…" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tanggal-klien">Tanggal</Label>
                <Input id="tanggal-klien" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10" />
              </div>
              <div className="grid gap-1.5">
                <Label>Paket</Label>
                <Select value={packageId} onValueChange={(value) => setPackageId(value ?? packages[0].id)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue>
                      {(value) => packageById(String(value ?? packages[0].id))?.name ?? "Pilih paket"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Gaun</Label>
                <Select value={attireId} onValueChange={(value) => setAttireId(value ?? "none")}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue>
                      {(value) =>
                        value === "none" || !value
                          ? "Nanti ditentukan"
                          : (attires.find((item) => item.id === value)?.name ?? "Pilih gaun")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nanti ditentukan</SelectItem>
                    {attires.map((attire) => (
                      <SelectItem key={attire.id} value={attire.id}>
                        {attire.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="catatan-klien">Catatan</Label>
                <Textarea id="catatan-klien" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-20" />
              </div>
              {date && clashes.length ? (
                <p className="text-sm text-destructive">
                  Tanggal ini sudah ada jadwal ({clashes.map((item) => item.clientName).join(", ")}). Studio tetap menerima pengajuan, lalu mengonfirmasi.
                </p>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={!ready} className="h-10">
                {ready ? "Kirim ke studio" : "Memuat studio…"}
              </Button>
            </form>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Acara yang dipilih mengikuti paket: {EVENT_LABEL[packageId === "wisuda" ? "wisuda" : packageId === "perak" ? "engagement" : "pengantin"]}.
          </p>
        </section>
      </main>
    </div>
  )
}
