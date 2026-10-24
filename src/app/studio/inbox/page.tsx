"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Inbox, MapPin, Send } from "lucide-react"

import { EmptyState, StudioLoading } from "@/components/studio-bits"
import { useStudio } from "@/components/studio-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatShortDate } from "@/lib/format"
import { partnerById, partnersInCity, TRADE_LABEL } from "@/lib/partners"
import { cn } from "@/lib/utils"

function formatStamp(iso: string) {
  const date = iso.slice(0, 10)
  const time = iso.slice(11, 16)
  return `${formatShortDate(date)} · ${time}`
}

function InboxPageInner() {
  const {
    ready,
    city,
    messages,
    partnerships,
    sendMessage,
    markThreadRead,
  } = useStudio()
  const params = useSearchParams()
  const requested = params.get("partner")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const localPartners = useMemo(() => partnersInCity(city), [city])
  const localMessages = useMemo(
    () => messages.filter((message) => message.city === city),
    [city, messages]
  )

  // Hanya partner yang sudah diajak kerja sama / punya pesan — jangan isi daftar kota.
  const threads = useMemo(() => {
    const partnerIds = new Set(partnerships.map((item) => item.partnerId))
    const ids = new Set<string>()
    for (const message of localMessages) {
      if (partnerIds.has(message.partnerId)) ids.add(message.partnerId)
    }
    for (const partnerId of partnerIds) ids.add(partnerId)
    return [...ids]
      .map((partnerId) => {
        const partner = partnerById(partnerId)
        if (!partner || partner.city !== city) return null
        const thread = localMessages
          .filter((message) => message.partnerId === partnerId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        const last = thread[thread.length - 1]
        const unread = thread.filter((message) => message.sender === "partner" && !message.read)
          .length
        return { partner, thread, last, unread }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""))
  }, [city, localMessages, partnerships])

  useEffect(() => {
    if (!ready) return
    const requestedOk =
      requested &&
      threads.some((thread) => thread.partner.id === requested) &&
      localPartners.some((partner) => partner.id === requested)
    if (requestedOk) {
      setActiveId(requested)
      return
    }
    setActiveId((current) => {
      if (current && threads.some((thread) => thread.partner.id === current)) return current
      return threads[0]?.partner.id ?? null
    })
  }, [localPartners, ready, requested, threads])

  useEffect(() => {
    if (!activeId) return
    markThreadRead(activeId)
  }, [activeId, localMessages.length, markThreadRead])

  if (!ready) return <StudioLoading />

  const active = activeId ? partnerById(activeId) : undefined
  const activeThread =
    active && active.city === city
      ? localMessages
          .filter((message) => message.partnerId === active.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      : []
  const status = active
    ? partnerships.find((item) => item.partnerId === active.id)?.status
    : undefined
  const unreadTotal = localMessages.filter(
    (message) => message.sender === "partner" && !message.read
  ).length

  function handleSend() {
    if (!active || !draft.trim()) return
    sendMessage(active.id, draft)
    setDraft("")
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl">Inbox</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Chat hanya dengan partner yang sudah kamu ajak kerja sama di {city}.
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-primary">
          <MapPin className="size-4" />
          {city}
          {threads.length
            ? unreadTotal
              ? ` · ${unreadTotal} belum dibaca`
              : " · semua sudah dibaca"
            : " · belum ada percakapan"}
        </p>
      </div>

      <div className="grid min-h-[28rem] overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-foreground/10 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2 border-b border-foreground/10 px-4 py-3 text-sm font-medium">
            <Inbox className="size-4 text-primary" />
            Percakapan {city}
          </div>
          {threads.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Belum ada percakapan"
                body="Ajakan kerja sama belum ada. Cari partner dulu, lalu inbox akan terisi di sini."
              />
              <Link
                href="/studio/partner"
                className={cn(buttonVariants({ size: "sm" }), "mt-3 h-9 w-full")}
              >
                Cari partner
              </Link>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto lg:max-h-[32rem]">
              {threads.map((item) => (
                <button
                  key={item.partner.id}
                  type="button"
                  onClick={() => setActiveId(item.partner.id)}
                  className={cn(
                    "grid w-full gap-1 border-b border-foreground/5 px-4 py-3 text-left transition hover:bg-accent/50",
                    activeId === item.partner.id && "bg-accent"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.partner.name}</span>
                    {item.unread ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                        {item.unread}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {TRADE_LABEL[item.partner.trade]} · {item.partner.area}
                  </span>
                  <span className="line-clamp-1 text-sm text-muted-foreground">
                    {item.last?.body ?? "Belum ada pesan. Mulai chat dari sini."}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[22rem] flex-col">
          {active && active.city === city && status ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-foreground/10 px-4 py-3">
                <div>
                  <p className="font-display text-2xl">{active.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {TRADE_LABEL[active.trade]} · {active.city} · {active.area} · {active.phone}
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs">
                  {status === "diterima" ? "Partner" : "Menunggu jawaban"}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {activeThread.length === 0 ? (
                  <EmptyState
                    title="Belum ada chat"
                    body={`Kirim pesan pertama ke ${active.name}.`}
                  />
                ) : (
                  activeThread.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        message.sender === "studio"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p>{message.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[11px]",
                          message.sender === "studio"
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatStamp(message.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form
                className="grid gap-2 border-t border-foreground/10 p-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSend()
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Tulis pesan ke ${active.name}…`}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!draft.trim()}>
                    <Send />
                    Kirim
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
              <EmptyState
                title="Belum ada yang diajak kerja sama"
                body={`Inbox kosong sampai kamu mengajak partner di ${city}. Mulai dari menu Partner.`}
              />
              <Link href="/studio/partner" className={cn(buttonVariants(), "h-10")}>
                Buka Partner
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <InboxPageInner />
    </Suspense>
  )
}
