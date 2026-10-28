"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/components/auth-provider"
import {
  consumePublicBookings,
  showBookingNotification,
  subscribeBookingAlerts,
} from "@/lib/booking-alerts"
import { createEmptyStudio, createSeed, studio } from "@/lib/catalog"
import {
  canCloudSync,
  markBookingRequestStatusCloud,
  pullBookingRequestsCloud,
  pullOwnerCloud,
  pushStudioCloud,
  studioHasRows,
} from "@/lib/cloud-sync"
import { normalizeEmail } from "@/lib/auth"
import { partnerById, partnersInCity } from "@/lib/partners"
import { studioBrand } from "@/lib/studio-brand"
import type {
  Booking,
  Combo,
  Expense,
  InboxMessage,
  NewBooking,
  Partnership,
  StudioState,
} from "@/lib/types"

const STORAGE_PREFIX = "key-assistant.studio.v3"
const LEGACY_STORAGE_PREFIXES = [
  "key-assistant.studio.v1",
  "key-assistant.studio.v2",
] as const

/** Booking/expense ids from createSeed — never treat these as real user data. */
const SAMPLE_BOOKING_IDS = new Set([
  "bk-sari",
  "bk-kirana",
  "bk-dinda",
  "bk-lala",
  "bk-nadia",
  "bk-nadila",
  "bk-maya",
  "bk-intan",
  "bk-raka",
  "bk-rio",
  "bk-past-1",
  "bk-past-2",
  "bk-past-3",
  "bk-past-4",
])
const SAMPLE_EXPENSE_IDS = new Set(["ex-1", "ex-2", "ex-3", "ex-4"])

type StudioViewMode = "real" | "demo"

type StudioContextValue = {
  ready: boolean
  notice: string | null
  dismissNotice: () => void
  viewMode: StudioViewMode
  city: string
  setCity: (city: string) => void
  bookings: Booking[]
  expenses: Expense[]
  partnerships: Partnership[]
  combos: Combo[]
  messages: InboxMessage[]
  addBooking: (input: NewBooking) => Booking
  updateBooking: (id: string, patch: Partial<Booking>) => void
  removeBooking: (id: string) => void
  addExpense: (input: Omit<Expense, "id">) => void
  invitePartner: (partnerId: string, note: string, accepted: boolean) => void
  acceptPartner: (partnerId: string) => void
  addCombo: (input: Omit<Combo, "id" | "createdAt">) => Combo
  removeCombo: (id: string) => void
  sendMessage: (partnerId: string, body: string) => void
  markThreadRead: (partnerId: string) => void
  showDemo: () => void
  showReal: () => void
  reset: () => void
  clearStudio: () => void
}

const StudioContext = createContext<StudioContextValue | null>(null)

function storageKeyFor(userId: string | null, email?: string | null) {
  if (email) return `${STORAGE_PREFIX}:email:${normalizeEmail(email)}`
  return `${STORAGE_PREFIX}:${userId ?? "guest"}`
}

function previewFlagKey(storageKey: string) {
  return `${storageKey}:preview-done`
}

function purgeLegacyStudioKeys(userId: string | null, email?: string | null) {
  const suffixes = [userId ?? "guest"]
  if (email) suffixes.push(`email:${normalizeEmail(email)}`)
  for (const suffix of suffixes) {
    for (const prefix of LEGACY_STORAGE_PREFIXES) {
      const key = `${prefix}:${suffix}`
      localStorage.removeItem(key)
      localStorage.removeItem(previewFlagKey(key))
    }
  }
  // Migrasi: salin data lama berbasis userId ke kunci email jika belum ada.
  if (userId && email) {
    const emailKey = storageKeyFor(userId, email)
    const idKey = `${STORAGE_PREFIX}:${userId}`
    if (!localStorage.getItem(emailKey) && localStorage.getItem(idKey)) {
      localStorage.setItem(emailKey, localStorage.getItem(idKey)!)
      const preview = localStorage.getItem(previewFlagKey(idKey))
      if (preview) localStorage.setItem(previewFlagKey(emailKey), preview)
    }
  }
}

function normalizeState(parsed: Partial<StudioState>, fallbackCity: string): StudioState {
  const empty = createEmptyStudio(fallbackCity)
  return {
    city: typeof parsed.city === "string" && parsed.city ? parsed.city : empty.city,
    bookings: Array.isArray(parsed.bookings) ? parsed.bookings : empty.bookings,
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : empty.expenses,
    partnerships: Array.isArray(parsed.partnerships) ? parsed.partnerships : empty.partnerships,
    combos: Array.isArray(parsed.combos) ? parsed.combos : empty.combos,
    messages: Array.isArray(parsed.messages) ? parsed.messages : empty.messages,
  }
}

/** True when stored "real" data is just the demo seed (or empty of real rows). */
function isSampleOrEmptyReal(state: StudioState): boolean {
  const realBookings = state.bookings.filter((booking) => !SAMPLE_BOOKING_IDS.has(booking.id))
  const realExpenses = state.expenses.filter((expense) => !SAMPLE_EXPENSE_IDS.has(expense.id))
  return realBookings.length === 0 && realExpenses.length === 0
}

function stripSampleRows(state: StudioState): StudioState {
  return {
    ...state,
    bookings: state.bookings.filter((booking) => !SAMPLE_BOOKING_IDS.has(booking.id)),
    expenses: state.expenses.filter((expense) => !SAMPLE_EXPENSE_IDS.has(expense.id)),
  }
}

function readStoredState(key: string, fallbackCity: string): StudioState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StudioState>
    if (!Array.isArray(parsed.bookings) || !Array.isArray(parsed.expenses)) {
      return null
    }
    const normalized = normalizeState(parsed, fallbackCity)
    if (isSampleOrEmptyReal(normalized)) {
      return createEmptyStudio(normalized.city)
    }
    return stripSampleRows(normalized)
  } catch {
    return null
  }
}

function sampleState(city: string): StudioState {
  return createSeed(city)
}

function hasStudioData(state: StudioState | null | undefined) {
  if (!state) return false
  return state.bookings.length > 0 || state.expenses.length > 0
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, user, updateOwnerCity } = useAuth()
  const userId = user?.id ?? null
  const userCity = user?.city ?? "Bandung"
  const [state, setState] = useState<StudioState | null>(null)
  const [viewMode, setViewMode] = useState<StudioViewMode>("real")
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const skipPersist = useRef(false)
  const viewModeRef = useRef<StudioViewMode>("real")
  const stateRef = useRef<StudioState | null>(null)
  const storageKeyRef = useRef<string | null>(null)

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    storageKeyRef.current = storageKey
  }, [storageKey])

  useEffect(() => {
    if (!authReady) return
    let cancelled = false
    const key = storageKeyFor(userId, user?.email)
    const city = user?.city ?? "Bandung"
    purgeLegacyStudioKeys(userId, user?.email)

    async function boot() {
      let stored = readStoredState(key, city)
      const previewDone = localStorage.getItem(previewFlagKey(key)) === "1"

      // Perangkat baru: tarik studio dari cloud (Auth metadata / owner_data) jika lokal kosong.
      if ((!stored || !studioHasRows(stored)) && user && canCloudSync(user.email) && userId) {
        const cloud = await pullOwnerCloud(userId)
        if (cloud?.studio && studioHasRows(cloud.studio)) {
          stored = normalizeState(cloud.studio, cloud.studio.city || city)
          localStorage.setItem(key, JSON.stringify(stored))
          localStorage.setItem(previewFlagKey(key), "1")
        }
      } else if (
        stored &&
        studioHasRows(stored) &&
        user &&
        canCloudSync(user.email) &&
        userId
      ) {
        // Perangkat lama: pastikan salinan lokal ikut ke cloud untuk HP lain.
        void pushStudioCloud(user, stored)
      }

      if (cancelled) return
      skipPersist.current = true
      setStorageKey(key)

      const hasPreview = localStorage.getItem(previewFlagKey(key)) === "1" || previewDone
      if (!stored && !hasPreview) {
        setViewMode("demo")
        viewModeRef.current = "demo"
        setState(sampleState(city))
        setNotice(
          "Ini tampilan data contoh agar kamu melihat studio yang sudah terisi. Klik “Data saya” untuk mulai dengan data real (kosong)."
        )
      } else {
        const real = stored ?? createEmptyStudio(city)
        setViewMode("real")
        viewModeRef.current = "real"
        setState(real)
        localStorage.setItem(key, JSON.stringify(real))
      }

      setReady(true)
      window.setTimeout(() => {
        skipPersist.current = false
      }, 0)
    }

    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId, user?.email])

  useEffect(() => {
    if (!ready || !state || !storageKey || skipPersist.current) return
    if (viewMode !== "real") return
    // Never persist demo/seed rows as "Data saya", but always keep owner city.
    const toSave = isSampleOrEmptyReal(state)
      ? { ...createEmptyStudio(state.city), city: state.city }
      : stripSampleRows(state)
    localStorage.setItem(storageKey, JSON.stringify(toSave))
    if (user && canCloudSync(user.email)) {
      void pushStudioCloud(user, toSave)
    }
  }, [ready, state, storageKey, user, viewMode])

  // Guard: if real mode somehow still holds only sample seed, wipe rows but keep city.
  useEffect(() => {
    if (!ready || viewMode !== "real" || !state) return
    if (!hasStudioData(state) || !isSampleOrEmptyReal(state)) return
    const empty = { ...createEmptyStudio(state.city), city: state.city }
    skipPersist.current = true
    setState(empty)
    stateRef.current = empty
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(empty))
    window.setTimeout(() => {
      skipPersist.current = false
    }, 0)
  }, [ready, viewMode, state, storageKey])

  // Tarik pengajuan dari link booking publik ke Data saya + notifikasi.
  useEffect(() => {
    if (!ready || viewMode !== "real" || !user) return
    const brandSlug = studioBrand(user).slug
    const watchedSlugs = new Set([studio.slug, brandSlug].filter(Boolean))

    function mergeBookings(incoming: Booking[]) {
      if (!incoming.length) return
      setState((current) => {
        const base = current ?? createEmptyStudio(userCity)
        const existing = new Set(base.bookings.map((item) => item.id))
        const fresh = incoming.filter((item) => !existing.has(item.id))
        if (!fresh.length) return base
        const next = { ...base, bookings: [...fresh, ...base.bookings] }
        stateRef.current = next
        const newest = fresh[0]
        if (newest?.approvalStatus === "diajukan" || newest?.approvalStatus === "menunggu_konfirmasi") {
          setNotice(
            `Pengajuan baru dari ${newest.clientName}. Buka Jadwal → Pengajuan untuk konfirmasi.`
          )
          void showBookingNotification(newest)
        }
        return next
      })
    }

    for (const slug of watchedSlugs) {
      mergeBookings(consumePublicBookings(slug))
    }

    // Lintasan perangkat: tarik booking_requests dari Supabase.
    if (canCloudSync(user.email) && user.id) {
      void pullBookingRequestsCloud(user.id).then((rows) => {
        if (!rows.length) return
        const fromCloud: Booking[] = rows.map((row) => {
          const p = row.payload
          return {
            id: String(p.bookingId || row.id),
            clientName: String(p.clientName || "Klien"),
            phone: String(p.phone || ""),
            eventType: "pengantin",
            date: String(p.date || ""),
            time: String(p.time || "08:00"),
            location: String(p.location || "Lokasi menyusul"),
            packageId: String(p.packageId || ""),
            packageName: typeof p.packageName === "string" ? p.packageName : undefined,
            attireId: null,
            price: Number(p.price) || 0,
            dp: Math.round((Number(p.price) || 0) * 0.3),
            paid: 0,
            notes: String(p.notes || "Pengajuan dari link booking (cloud)"),
            source: "pricelist",
            attireReturned: false,
            createdAt: String(p.createdAt || row.created_at || new Date().toISOString()),
            approvalStatus: "diajukan",
          }
        })
        mergeBookings(fromCloud)
        for (const row of rows) {
          void markBookingRequestStatusCloud(row.id, "menunggu_konfirmasi")
        }
      })
    }

    const unsubscribe = subscribeBookingAlerts((payload) => {
      if (!watchedSlugs.has(payload.slug)) return
      const fromQueue = consumePublicBookings(payload.slug)
      mergeBookings(fromQueue.length ? fromQueue : [payload.booking])
    })

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        for (const slug of watchedSlugs) {
          mergeBookings(consumePublicBookings(slug))
        }
      }
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      unsubscribe()
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [ready, user, userCity, viewMode])

  // Data contoh: pastikan inbox/partner sesuai kota (seed lama sering hanya Bandung).
  useEffect(() => {
    if (!ready || viewMode !== "demo" || !state) return
    if (partnersInCity(state.city).length === 0) return
    const hasLocalPartner = state.partnerships.some(
      (item) => partnerById(item.partnerId)?.city === state.city
    )
    const hasLocalMessage = state.messages.some((item) => item.city === state.city)
    if (hasLocalPartner && hasLocalMessage) return
    const demo = sampleState(state.city)
    skipPersist.current = true
    setState(demo)
    stateRef.current = demo
    window.setTimeout(() => {
      skipPersist.current = false
    }, 0)
  }, [ready, viewMode, state])

  const value = useMemo<StudioContextValue>(() => {
    /** Mutasi mengikuti mode aktif. Data contoh tidak pernah menimpa Data saya; ganti mode hanya lewat tombol pengguna. */
    function withActiveBase(updater: (base: StudioState) => StudioState) {
      const base = stateRef.current ?? createEmptyStudio(userCity)
      const next = updater(base)
      stateRef.current = next
      setState(next)
      return next
    }

    function enterDemo() {
      const city = stateRef.current?.city ?? userCity
      if (viewModeRef.current === "real" && stateRef.current && storageKeyRef.current) {
        localStorage.setItem(storageKeyRef.current, JSON.stringify(stateRef.current))
      }
      const demo = sampleState(city)
      skipPersist.current = true
      viewModeRef.current = "demo"
      setViewMode("demo")
      setState(demo)
      stateRef.current = demo
      setNotice("Menampilkan data contoh. Data real kamu tetap aman — mode hanya berubah jika kamu memilihnya.")
      window.setTimeout(() => {
        skipPersist.current = false
      }, 0)
    }

    return {
      ready,
      notice,
      dismissNotice: () => setNotice(null),
      viewMode,
      city: state?.city ?? userCity,
      setCity: (city) => {
        const next = city.trim()
        if (!next) return
        // Wilayah studio hanya diganti owner di Data saya — jangan ikut berubah dari Data contoh / login.
        if (viewModeRef.current === "demo") {
          setNotice(
            "Wilayah hanya bisa diganti di Data saya oleh owner. Klik “Data saya” dulu, lalu pilih wilayah."
          )
          return
        }
        withActiveBase((base) => ({ ...base, city: next }))
        void updateOwnerCity(next)
        setNotice(`Wilayah studio diganti ke ${next}. Hanya owner yang bisa mengubah ini.`)
      },
      bookings: state?.bookings ?? [],
      expenses: state?.expenses ?? [],
      partnerships: state?.partnerships ?? [],
      combos: state?.combos ?? [],
      messages: state?.messages ?? [],
      addBooking: (input) => {
        const booking: Booking = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        withActiveBase((base) => ({ ...base, bookings: [booking, ...base.bookings] }))
        return booking
      },
      updateBooking: (id, patch) => {
        withActiveBase((base) => ({
          ...base,
          bookings: base.bookings.map((booking) =>
            booking.id === id ? { ...booking, ...patch } : booking
          ),
        }))
      },
      removeBooking: (id) => {
        withActiveBase((base) => ({
          ...base,
          bookings: base.bookings.filter((booking) => booking.id !== id),
        }))
      },
      addExpense: (input) => {
        const expense: Expense = { ...input, id: crypto.randomUUID() }
        withActiveBase((base) => ({ ...base, expenses: [expense, ...base.expenses] }))
      },
      invitePartner: (partnerId, note, accepted) => {
        const next: Partnership = {
          partnerId,
          status: accepted ? "diterima" : "diminta",
          note,
          createdAt: new Date().toISOString(),
        }
        withActiveBase((base) => {
          const rest = base.partnerships.filter((item) => item.partnerId !== partnerId)
          return { ...base, partnerships: [next, ...rest] }
        })
      },
      acceptPartner: (partnerId) => {
        withActiveBase((base) => ({
          ...base,
          partnerships: base.partnerships.map((item) =>
            item.partnerId === partnerId ? { ...item, status: "diterima" } : item
          ),
        }))
      },
      addCombo: (input) => {
        const combo: Combo = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        withActiveBase((base) => ({ ...base, combos: [combo, ...base.combos] }))
        return combo
      },
      removeCombo: (id) => {
        withActiveBase((base) => ({
          ...base,
          combos: base.combos.filter((combo) => combo.id !== id),
        }))
      },
      sendMessage: (partnerId, body) => {
        const partner = partnerById(partnerId)
        if (!partner || !body.trim()) return
        const outbound: InboxMessage = {
          id: crypto.randomUUID(),
          partnerId,
          city: partner.city,
          sender: "studio",
          body: body.trim(),
          createdAt: new Date().toISOString(),
          read: true,
        }
        withActiveBase((base) => ({ ...base, messages: [...base.messages, outbound] }))

        if (partner.repliesFast) {
          window.setTimeout(() => {
            // Balasan contoh hanya di Data contoh; Data saya tidak diubah otomatis.
            if (viewModeRef.current !== "demo") return
            const reply: InboxMessage = {
              id: crypto.randomUUID(),
              partnerId,
              city: partner.city,
              sender: "partner",
              body: `Siap, ${partner.name} sudah baca. Kita cocokkan tanggal di ${partner.city} ya.`,
              createdAt: new Date().toISOString(),
              read: false,
            }
            setState((current) => {
              if (!current || viewModeRef.current !== "demo") return current
              const next = { ...current, messages: [...current.messages, reply] }
              stateRef.current = next
              return next
            })
          }, 700)
        }
      },
      markThreadRead: (partnerId) => {
        withActiveBase((base) => {
          const needsUpdate = base.messages.some(
            (message) =>
              message.partnerId === partnerId && message.sender === "partner" && !message.read
          )
          if (!needsUpdate) return base
          return {
            ...base,
            messages: base.messages.map((message) =>
              message.partnerId === partnerId && message.sender === "partner"
                ? { ...message, read: true }
                : message
            ),
          }
        })
      },
      showDemo: enterDemo,
      showReal: () => {
        const key = storageKeyRef.current
        purgeLegacyStudioKeys(userId)
        // Pulihkan Data saya apa adanya (termasuk wilayah owner) — jangan timpa kota dari data contoh.
        const stored = key ? readStoredState(key, userCity) : null
        const real = stored ?? createEmptyStudio(userCity)
        skipPersist.current = true
        viewModeRef.current = "real"
        setViewMode("real")
        setState(real)
        stateRef.current = real
        if (key) {
          localStorage.setItem(previewFlagKey(key), "1")
          localStorage.setItem(key, JSON.stringify(real))
        }
        setNotice(
          hasStudioData(real)
            ? "Kembali ke data saya (real)."
            : "Kembali ke data saya. Studio kosong — wilayah tetap milik owner."
        )
        window.setTimeout(() => {
          skipPersist.current = false
        }, 0)
      },
      reset: enterDemo,
      clearStudio: () => {
        const city = stateRef.current?.city ?? userCity
        const empty = createEmptyStudio(city)
        skipPersist.current = true
        viewModeRef.current = "real"
        setViewMode("real")
        setState(empty)
        stateRef.current = empty
        if (storageKeyRef.current) {
          localStorage.setItem(storageKeyRef.current, JSON.stringify(empty))
          localStorage.setItem(previewFlagKey(storageKeyRef.current), "1")
        }
        setNotice("Data real dikosongkan. Booking dan laba kembali nol.")
        window.setTimeout(() => {
          skipPersist.current = false
        }, 0)
      },
    }
  }, [notice, ready, state, updateOwnerCity, userCity, userId, viewMode])

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio() {
  const context = useContext(StudioContext)
  if (!context) {
    throw new Error("useStudio harus dipakai di dalam StudioProvider")
  }
  return context
}
