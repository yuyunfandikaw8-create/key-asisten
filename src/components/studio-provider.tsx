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
import { createEmptyStudio, createSeed } from "@/lib/catalog"
import { partnerById } from "@/lib/partners"
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

function storageKeyFor(userId: string | null) {
  return `${STORAGE_PREFIX}:${userId ?? "guest"}`
}

function previewFlagKey(storageKey: string) {
  return `${storageKey}:preview-done`
}

function purgeLegacyStudioKeys(userId: string | null) {
  const suffix = userId ?? "guest"
  for (const prefix of LEGACY_STORAGE_PREFIXES) {
    const key = `${prefix}:${suffix}`
    localStorage.removeItem(key)
    localStorage.removeItem(previewFlagKey(key))
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
  return { ...createSeed(), city }
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
    const key = storageKeyFor(userId)
    const city = user?.city ?? "Bandung"
    purgeLegacyStudioKeys(userId)
    const stored = readStoredState(key, city)
    const previewDone = localStorage.getItem(previewFlagKey(key)) === "1"

    skipPersist.current = true
    setStorageKey(key)

    if (!stored && !previewDone) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId])

  useEffect(() => {
    if (!ready || !state || !storageKey || skipPersist.current) return
    if (viewMode !== "real") return
    // Never persist demo/seed rows as "Data saya", but always keep owner city.
    const toSave = isSampleOrEmptyReal(state)
      ? { ...createEmptyStudio(state.city), city: state.city }
      : stripSampleRows(state)
    localStorage.setItem(storageKey, JSON.stringify(toSave))
  }, [ready, state, storageKey, viewMode])

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

  const value = useMemo<StudioContextValue>(() => {
    function leaveDemoForReal(message?: string) {
      const key = storageKeyRef.current
      const city = stateRef.current?.city ?? userCity
      const stored = key ? readStoredState(key, city) : null
      // Never carry demo/seed rows into Data saya — only keep true user rows.
      const real = stored ?? createEmptyStudio(city)
      skipPersist.current = true
      viewModeRef.current = "real"
      setViewMode("real")
      setState(real)
      stateRef.current = real
      if (key) {
        localStorage.setItem(previewFlagKey(key), "1")
        localStorage.setItem(key, JSON.stringify(real))
      }
      if (message) setNotice(message)
      window.setTimeout(() => {
        skipPersist.current = false
      }, 0)
      return real
    }

    function withRealBase(updater: (base: StudioState) => StudioState) {
      let base = stateRef.current ?? createEmptyStudio(userCity)
      if (viewModeRef.current === "demo") {
        base = leaveDemoForReal(
          "Kamu mulai mengedit — beralih ke data saya (real). Data contoh tidak diubah."
        )
      }
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
      setNotice("Menampilkan data contoh. Data real kamu aman. Klik “Data saya” untuk kembali.")
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
        withRealBase((base) => ({ ...base, city: next }))
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
        withRealBase((base) => ({ ...base, bookings: [booking, ...base.bookings] }))
        return booking
      },
      updateBooking: (id, patch) => {
        withRealBase((base) => ({
          ...base,
          bookings: base.bookings.map((booking) =>
            booking.id === id ? { ...booking, ...patch } : booking
          ),
        }))
      },
      removeBooking: (id) => {
        withRealBase((base) => ({
          ...base,
          bookings: base.bookings.filter((booking) => booking.id !== id),
        }))
      },
      addExpense: (input) => {
        const expense: Expense = { ...input, id: crypto.randomUUID() }
        withRealBase((base) => ({ ...base, expenses: [expense, ...base.expenses] }))
      },
      invitePartner: (partnerId, note, accepted) => {
        const next: Partnership = {
          partnerId,
          status: accepted ? "diterima" : "diminta",
          note,
          createdAt: new Date().toISOString(),
        }
        withRealBase((base) => {
          const rest = base.partnerships.filter((item) => item.partnerId !== partnerId)
          return { ...base, partnerships: [next, ...rest] }
        })
      },
      acceptPartner: (partnerId) => {
        withRealBase((base) => ({
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
        withRealBase((base) => ({ ...base, combos: [combo, ...base.combos] }))
        return combo
      },
      removeCombo: (id) => {
        withRealBase((base) => ({
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
        withRealBase((base) => ({ ...base, messages: [...base.messages, outbound] }))

        if (partner.repliesFast) {
          window.setTimeout(() => {
            if (viewModeRef.current === "demo") return
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
              if (!current) return current
              const next = { ...current, messages: [...current.messages, reply] }
              stateRef.current = next
              return next
            })
          }, 700)
        }
      },
      markThreadRead: (partnerId) => {
        withRealBase((base) => {
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
