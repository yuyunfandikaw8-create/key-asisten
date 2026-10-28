"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Handshake, Search } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useStudio } from "@/components/studio-provider"
import {
  ACCOUNTS_STORAGE_KEY,
  DEMO_ACCOUNTS,
  normalizeEmail,
  type AuthUser,
} from "@/lib/auth"
import { partners, TRADE_LABEL } from "@/lib/partners"
import { cn } from "@/lib/utils"

type SearchHit =
  | {
      kind: "partner"
      id: string
      title: string
      subtitle: string
      city: string
    }
  | {
      kind: "owner"
      id: string
      title: string
      subtitle: string
      city: string
    }

function readStoredOwners(): AuthUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AuthUser[]
    return Array.isArray(parsed) ? parsed.filter((item) => item.role !== "client") : []
  } catch {
    return []
  }
}

export function HeaderPeopleSearch({ className }: { className?: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const { city, viewMode } = useStudio()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const demoDirectory = viewMode === "demo"
  const demoEmails = useMemo(
    () => new Set(DEMO_ACCOUNTS.map((account) => normalizeEmail(account.email))),
    []
  )

  const owners = useMemo(() => {
    const map = new Map<string, AuthUser>()
    // Data contoh: boleh tampilkan akun demo. Data saya: hanya owner yang benar-benar daftar.
    if (demoDirectory) {
      for (const account of DEMO_ACCOUNTS) {
        if (account.role === "client") continue
        map.set(normalizeEmail(account.email), account)
      }
    }
    for (const account of readStoredOwners()) {
      const email = normalizeEmail(account.email)
      if (!demoDirectory && demoEmails.has(email)) continue
      map.set(email, account)
    }
    if (user) map.set(normalizeEmail(user.email), user)
    return [...map.values()]
  }, [demoDirectory, demoEmails, user])

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 1) return [] as SearchHit[]

    const partnerHits: SearchHit[] = demoDirectory
      ? partners
          .filter((partner) => {
            const haystack =
              `${partner.name} ${TRADE_LABEL[partner.trade]} ${partner.city} ${partner.area} ${partner.offer}`.toLowerCase()
            return haystack.includes(needle)
          })
          .sort((a, b) => Number(b.city === city) - Number(a.city === city))
          .slice(0, 6)
          .map((partner) => ({
            kind: "partner" as const,
            id: partner.id,
            title: partner.name,
            subtitle: `${TRADE_LABEL[partner.trade]} · ${partner.city} · ${partner.area}`,
            city: partner.city,
          }))
      : []

    const ownerHits: SearchHit[] = owners
      .filter((owner) => {
        if (user && normalizeEmail(owner.email) === normalizeEmail(user.email)) return false
        const haystack =
          `${owner.studioName || ""} ${owner.name || ""} ${owner.city || ""} ${owner.email}`.toLowerCase()
        return haystack.includes(needle)
      })
      .slice(0, 4)
      .map((owner) => ({
        kind: "owner" as const,
        id: owner.id || owner.email,
        title: owner.studioName?.trim() || owner.name,
        subtitle: `Owner · ${owner.city || "—"} · ${owner.name}`,
        city: owner.city || "",
      }))

    return [...partnerHits, ...ownerHits]
  }, [city, demoDirectory, owners, query, user])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function go(hit: SearchHit) {
    setOpen(false)
    setQuery("")
    if (hit.kind === "partner") {
      router.push(`/studio/partner?q=${encodeURIComponent(hit.title)}`)
      return
    }
    router.push(`/studio/partner?q=${encodeURIComponent(hit.title)}&jenis=owner`)
  }

  function submitAll() {
    const needle = query.trim()
    if (!needle) return
    setOpen(false)
    router.push(`/studio/partner?q=${encodeURIComponent(needle)}`)
    setQuery("")
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              if (hits[0]) go(hits[0])
              else submitAll()
            }
          }}
          placeholder="Cari partner atau owner…"
          aria-label="Cari partner atau owner"
          className="h-8 w-full min-w-0 rounded-full border border-border/80 bg-[oklch(0.97_0.01_20)] pr-3 pl-8 text-xs outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10 sm:text-sm"
        />
      </div>

      {open && query.trim() ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-border/70 bg-card py-1 shadow-lg">
          {hits.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              {demoDirectory
                ? `Tidak ada partner/owner untuk “${query.trim()}”.`
                : `Belum ada owner terdaftar untuk “${query.trim()}”. Direktori partner masih kosong.`}
            </p>
          ) : (
            hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.id}`}
                type="button"
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-muted/70"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(hit)}
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  {hit.kind === "partner" ? (
                    <Handshake className="size-3.5" />
                  ) : (
                    <Building2 className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{hit.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {hit.kind === "partner" ? "Partner" : "Owner"} · {hit.subtitle}
                  </span>
                </span>
              </button>
            ))
          )}
          <button
            type="button"
            className="block w-full border-t px-3 py-2.5 text-left text-xs font-medium text-primary hover:bg-muted/50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={submitAll}
          >
            Lihat semua hasil di Partner →
          </button>
        </div>
      ) : null}
    </div>
  )
}
