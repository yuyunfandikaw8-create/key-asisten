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

const STORAGE_PREFIX = "key-assistant.studio.v1"

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

function readStoredState(key: string, fallbackCity: string): StudioState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StudioState>
    if (!Array.isArray(parsed.bookings) || !Array.isArray(parsed.expenses)) {
      return null
    }
    return normalizeState(parsed, fallbackCity)
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

/** Data saya default: seed terisi (termasuk Rio & Nadila), bukan studio kosong. */
function defaultRealState(city: string): StudioState {
  return sampleState(city)
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, user } = useAuth()
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
    const stored = readStoredState(key, city)
    const previewDone = localStorage.getItem(previewFlagKey(key)) === "1"

    skipPersist.current = true
    setStorageKey(key)

    if (!stored && !previewDone) {
      setViewMode("demo")
      setState(sampleState(city))
      setNotice(
        "Ini tampilan data contoh agar kamu melihat studio yang sudah terisi. Klik “Data saya” untuk membuka data kamu (terisi contoh booking seperti Rio dan Nadila)."
      )
    } else {
      setViewMode("real")
      setState(hasStudioData(stored) ? stored! : defaultRealState(city))
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
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [ready, state, storageKey, viewMode])

  const value = useMemo<StudioContextValue>(() => {
    function leaveDemoForReal(message?: string) {
      const key = storageKeyRef.current
      const city = stateRef.current?.city ?? userCity
      const stored = key ? readStoredState(key, city) : null
      const real = hasStudioData(stored) ? stored! : defaultRealState(city)
      skipPersist.current = true
      viewModeRef.current = "real"
      setViewMode("real")
      setState(real)
      stateRef.current = real
      if (key) {
        localStorage.setItem(previewFlagKey(key), "1")
        if (!hasStudioData(stored)) {
          localStorage.setItem(key, JSON.stringify(real))
        }
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
        withRealBase((base) => ({ ...base, city }))
        setNotice(`Lokasi aktif diganti ke ${city}. Partner dan inbox hanya menampilkan kota ini.`)
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
        const stored = key ? readStoredState(key, userCity) : null
        leaveDemoForReal(
          hasStudioData(stored)
            ? "Kembali ke data saya (real)."
            : "Kembali ke data saya — booking contoh (Rio, Nadila, dan lainnya) sudah siap. Edit bebas; ini data real kamu."
        )
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
  }, [notice, ready, state, userCity, viewMode])

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio() {
  const context = useContext(StudioContext)
  if (!context) {
    throw new Error("useStudio harus dipakai di dalam StudioProvider")
  }
  return context
}
