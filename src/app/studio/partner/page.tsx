"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { EmptyState, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { packageById, packages } from "@/lib/catalog"
import { addDays, formatShortDate, rupiah, todayISO } from "@/lib/format"
import {
  comboTotal,
  partnerById,
  partnersInCity,
  sharesOf,
  TRADE_LABEL,
  type Partner,
} from "@/lib/partners"
import type { Trade } from "@/lib/types"
import { cn } from "@/lib/utils"

const filters: { id: string; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "dekor", label: "Dekor" },
  { id: "makeup", label: "Makeup" },
  { id: "baju", label: "Sewa baju" },
  { id: "hair", label: "Hairdo" },
  { id: "kosong", label: "Tanggal kosong" },
]

function isBusy(partner: Partner, date: string, anchor: string) {
  if (!anchor || !date) return false
  return partner.busyOffsets.some((offset) => addDays(anchor, offset) === date)
}

export default function PartnerPage() {
  const {
    ready,
    city,
    partnerships,
    combos,
    invitePartner,
    acceptPartner,
    addCombo,
    removeCombo,
  } = useStudio()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("semua")
  const [anchor, setAnchor] = useState("")
  const [freeDate, setFreeDate] = useState("")

  useEffect(() => {
    const iso = todayISO()
    setAnchor(iso)
    setFreeDate((current) => current || iso)
  }, [])
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [comboName, setComboName] = useState("")
  const [packageId, setPackageId] = useState("adat")
  const [picked, setPicked] = useState<string[]>([])
  const [discount, setDiscount] = useState("500000")
  const [comboNote, setComboNote] = useState("")
  const [comboError, setComboError] = useState("")

  const localPartners = useMemo(() => partnersInCity(city), [city])
  const statusOf = (id: string) => partnerships.find((item) => item.partnerId === id)?.status
  const accepted = useMemo(
    () =>
      partnerships.filter((item) => {
        const partner = partnerById(item.partnerId)
        return item.status === "diterima" && partner?.city === city
      }),
    [city, partnerships]
  )
  const acceptedIds = accepted.map((item) => item.partnerId).join("|")
  const selectedPackage = packageById(packageId) ?? packages[1]
  const discountValue = Number(discount.replace(/\D/g, "")) || 0
  const preview = comboTotal(selectedPackage.price, picked, discountValue)

  useEffect(() => {
    const ids = acceptedIds ? acceptedIds.split("|") : []
    setPicked((current) => {
      const stillValid = current.filter((id) => ids.includes(id))
      if (stillValid.length) return stillValid
      return ids[0] ? [ids[0]] : []
    })
  }, [acceptedIds])

  const visible = useMemo(() => {
    return localPartners.filter((partner) => {
      const haystack = `${partner.name} ${partner.area} ${partner.offer}`.toLowerCase()
      if (query && !haystack.includes(query.toLowerCase())) return false
      if (filter === "dekor" || filter === "makeup" || filter === "baju" || filter === "hair") {
        return partner.trade === (filter as Trade)
      }
      if (filter === "kosong") return !isBusy(partner, freeDate, anchor)
      return true
    })
  }, [anchor, filter, freeDate, localPartners, query])

  const suggestions = localPartners.filter(
    (partner) => partner.repliesFast && !statusOf(partner.id)
  )

  if (!ready) return <StudioLoading />

  function sendInvite() {
    const partner = inviteId ? partnerById(inviteId) : undefined
    if (!partner) return
    const acceptedNow = partner.repliesFast
    invitePartner(partner.id, note.trim(), acceptedNow)
    setInviteMessage(
      acceptedNow
        ? `${partner.name} menerima ajakan. Mereka sudah bisa masuk kombo.`
        : `Ajakan terkirim ke ${partner.name}. Mereka belum membalas.`
    )
    setInviteId(null)
    setNote("")
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-4xl">Cari partner</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Hanya partner di {city} yang tampil di sini. Ganti lokasi di menu atas untuk Surabaya,
          Jakarta, dan kota lain. Setelah setuju, susun kombo atau chat di Inbox.
        </p>
      </div>

      {inviteMessage ? (
        <p className="rounded-xl bg-accent px-4 py-3 text-sm">{inviteMessage}</p>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-2xl">Siap diajak di {city}</h2>
        {suggestions.length === 0 ? (
          <EmptyState
            title="Tidak ada saran baru"
            body="Partner yang membalas cepat di kota ini sudah diajak. Gunakan saringan untuk melihat yang lain."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {suggestions.map((partner) => (
              <article key={partner.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  {TRADE_LABEL[partner.trade]} · {partner.area}
                </p>
                <h3 className="mt-1 font-display text-2xl">{partner.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{partner.offer}</p>
                <p className="mt-2 text-sm">Bagian mereka {rupiah(partner.share)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => setInviteId(partner.id)}>Ajak kerja sama</Button>
                  <Link
                    href={`/studio/inbox?partner=${partner.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "h-8")}
                  >
                    Inbox
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl">Direktori</h2>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, wilayah, atau jasa"
            aria-label="Cari partner"
            className="h-10 bg-card sm:max-w-xs"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm",
                filter === item.id ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {filter === "kosong" ? (
          <div className="grid max-w-xs gap-1.5">
            <Label htmlFor="tanggal-kosong">Tanggal yang dicari</Label>
            <Input
              id="tanggal-kosong"
              type="date"
              value={freeDate}
              onChange={(event) => setFreeDate(event.target.value)}
              className="h-10 bg-card"
            />
          </div>
        ) : null}
        {visible.length === 0 ? (
          <EmptyState
            title="Tidak ada partner di saringan ini"
            body={
              query
                ? `Tidak ada nama atau jasa yang memuat “${query}”.`
                : `Belum ada partner untuk saringan ini di ${city}. Ganti lokasi atau peran.`
            }
          />
        ) : (
          <div className="grid gap-3">
            {visible.map((partner) => {
              const status = statusOf(partner.id)
              const busy = isBusy(partner, freeDate, anchor)
              return (
                <article
                  key={partner.id}
                  className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-2xl">{partner.name}</h3>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
                        {TRADE_LABEL[partner.trade]}
                      </span>
                      {status === "diterima" ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          Partner
                        </span>
                      ) : null}
                      {status === "diminta" ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Menunggu jawaban</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {partner.city} · {partner.area} · {partner.offer}
                    </p>
                    <p className="mt-1 text-sm">{partner.blurb}</p>
                    <p className="mt-2 text-sm">
                      Bagian di kombo {rupiah(partner.share)}
                      {busy ? ` · penuh ${formatShortDate(freeDate)}` : freeDate ? " · tanggal ini kosong" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/studio/inbox?partner=${partner.id}`}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Inbox
                    </Link>
                    {status === "diterima" ? (
                      <p className="self-center text-sm text-muted-foreground">Sudah bisa masuk kombo.</p>
                    ) : null}
                    {status === "diminta" ? (
                      <Button variant="outline" onClick={() => acceptPartner(partner.id)}>
                        Tandai mereka setuju
                      </Button>
                    ) : null}
                    {!status ? (
                      <Button onClick={() => setInviteId(partner.id)}>Ajak kerja sama</Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl">Kombo</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Harga kombo adalah paket rias ditambah bagian partner, lalu dipotong supaya lebih murah daripada memesan terpisah. Yang dipublikasikan muncul di pricelist.
          </p>
        </div>

        {accepted.length === 0 ? (
          <EmptyState
            title="Belum ada partner yang setuju"
            body="Ajak dekor, makeup, hairdo, atau sewa baju dulu. Kombo hanya bisa disusun dengan partner yang sudah menerima."
          />
        ) : (
          <form
            className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            onSubmit={(event) => {
              event.preventDefault()
              if (!comboName.trim()) {
                setComboError("Beri nama kombo.")
                return
              }
              if (!picked.length) {
                setComboError("Pilih minimal satu partner.")
                return
              }
              const subtotal = selectedPackage.price + sharesOf(picked)
              if (discountValue >= subtotal) {
                setComboError("Potongan harus lebih kecil dari jumlah harga.")
                return
              }
              addCombo({
                name: comboName.trim(),
                packageId: selectedPackage.id,
                partnerIds: picked,
                discount: discountValue,
                note: comboNote.trim(),
                published: true,
              })
              setComboName("")
              setComboNote("")
              setComboError("")
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="nama-kombo">Nama kombo</Label>
              <Input
                id="nama-kombo"
                value={comboName}
                onChange={(event) => setComboName(event.target.value)}
                placeholder="Akad, dekor, dan kebaya"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Paket rias Laras</Label>
              <Select value={packageId} onValueChange={(value) => setPackageId(value ?? "adat")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>
                    {(value) => packageById(String(value ?? "adat"))?.name ?? "Paket"}
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
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Partner yang ikut</legend>
              {accepted.map((item) => {
                const partner = partnerById(item.partnerId)
                if (!partner) return null
                const checked = picked.includes(partner.id)
                return (
                  <label key={partner.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setPicked((current) =>
                          checked ? current.filter((id) => id !== partner.id) : [...current, partner.id]
                        )
                      }
                    />
                    <span>
                      {partner.name} · {TRADE_LABEL[partner.trade]} · {rupiah(partner.share)}
                    </span>
                  </label>
                )
              })}
            </fieldset>
            <div className="grid gap-1.5">
              <Label htmlFor="potongan">Potongan kombo</Label>
              <Input
                id="potongan"
                inputMode="numeric"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="catatan-kombo">Catatan untuk klien</Label>
              <Textarea
                id="catatan-kombo"
                value={comboNote}
                onChange={(event) => setComboNote(event.target.value)}
                className="min-h-20"
              />
            </div>
            <p className="text-sm">
              Terpisah {rupiah(selectedPackage.price + sharesOf(picked))} · harga kombo {rupiah(preview)}
            </p>
            {comboError ? <p className="text-sm text-destructive">{comboError}</p> : null}
            <Button type="submit">Simpan dan tampilkan di pricelist</Button>
          </form>
        )}

        {combos.filter((combo) =>
          combo.partnerIds.some((id) => partnerById(id)?.city === city)
        ).length === 0 ? (
          <EmptyState
            title="Belum ada kombo"
            body={`Susun satu paket bersama partner di ${city} yang sudah setuju. Klien nanti melihatnya di pricelist.`}
          />
        ) : (
          <div className="grid gap-3">
            {combos
              .filter((combo) => combo.partnerIds.some((id) => partnerById(id)?.city === city))
              .map((combo) => {
              const pkg = packageById(combo.packageId)
              const names = combo.partnerIds
                .map((id) => partnerById(id))
                .filter((partner) => partner !== undefined)
              const total = comboTotal(pkg?.price ?? 0, combo.partnerIds, combo.discount)
              return (
                <article key={combo.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl">{combo.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pkg?.name ?? "Paket"} + {names.map((partner) => partner.name).join(", ")}
                      </p>
                    </div>
                    <p className="font-medium">{rupiah(total)}</p>
                  </div>
                  <ul className="mt-3 grid gap-1 text-sm">
                    <li>Rias {pkg?.name} · {rupiah(pkg?.price ?? 0)}</li>
                    {names.map((partner) => (
                      <li key={partner.id}>
                        {partner.name} · {TRADE_LABEL[partner.trade]} · {rupiah(partner.share)}
                      </li>
                    ))}
                    <li>Potongan {rupiah(combo.discount)}</li>
                  </ul>
                  {combo.note ? <p className="mt-2 text-sm text-muted-foreground">{combo.note}</p> : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {combo.published ? "Tampil di pricelist." : "Disimpan, belum tampil."}
                  </p>
                  <Button className="mt-3" variant="outline" onClick={() => removeCombo(combo.id)}>
                    Hapus kombo
                  </Button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Dialog open={Boolean(inviteId)} onOpenChange={(open) => !open && setInviteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajak {inviteId ? partnerById(inviteId)?.name : "partner"}</DialogTitle>
            <DialogDescription>
              Ceritakan tanggal atau jenis acara yang sering kalian kerjakan bersama. Partner yang membalas cepat langsung tercatat setuju di demo ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="catatan-ajak">Catatan</Label>
            <Textarea
              id="catatan-ajak"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Akad rumah di Bandung, butuh pelaminan adat."
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteId(null)}>
              Batal
            </Button>
            <Button onClick={sendInvite}>Kirim ajakan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
