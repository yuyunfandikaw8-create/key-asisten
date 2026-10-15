"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { createSeed } from "@/lib/catalog"
import type { Booking, Combo, Expense, NewBooking, Partnership, StudioState } from "@/lib/types"

const STORAGE_KEY = "riasaja.laras.v2"

type StudioContextValue = {
  ready: boolean
  notice: string | null
  dismissNotice: () => void
  bookings: Booking[]
  expenses: Expense[]
  partnerships: Partnership[]
  combos: Combo[]
  addBooking: (input: NewBooking) => Booking
  updateBooking: (id: string, patch: Partial<Booking>) => void
  removeBooking: (id: string) => void
  addExpense: (input: Omit<Expense, "id">) => void
  invitePartner: (partnerId: string, note: string, accepted: boolean) => void
  acceptPartner: (partnerId: string) => void
  addCombo: (input: Omit<Combo, "id" | "createdAt">) => Combo
  removeCombo: (id: string) => void
  reset: () => void
}

const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState | null>(null)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          setState(createSeed())
        } else {
        const parsed = JSON.parse(raw) as Partial<StudioState>
        if (!Array.isArray(parsed.bookings) || !Array.isArray(parsed.expenses)) {
          throw new Error("Data studio tidak lengkap")
        }
        const seed = createSeed()
        setState({
          bookings: parsed.bookings,
          expenses: parsed.expenses,
          partnerships: Array.isArray(parsed.partnerships) ? parsed.partnerships : seed.partnerships,
          combos: Array.isArray(parsed.combos) ? parsed.combos : seed.combos,
        })
        }
      } catch {
        setState(createSeed())
        setNotice("Data di browser ini tidak bisa dibaca. Contoh studio Laras Bridal dikembalikan.")
      }
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready || !state) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [ready, state])

  const value = useMemo<StudioContextValue>(() => {
    return {
      ready,
      notice,
      dismissNotice: () => setNotice(null),
      bookings: state?.bookings ?? [],
      expenses: state?.expenses ?? [],
      partnerships: state?.partnerships ?? [],
      combos: state?.combos ?? [],
      addBooking: (input) => {
        const booking: Booking = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        setState((current) =>
          current ? { ...current, bookings: [booking, ...current.bookings] } : current
        )
        return booking
      },
      updateBooking: (id, patch) => {
        setState((current) =>
          current
            ? {
                ...current,
                bookings: current.bookings.map((booking) =>
                  booking.id === id ? { ...booking, ...patch } : booking
                ),
              }
            : current
        )
      },
      removeBooking: (id) => {
        setState((current) =>
          current
            ? {
                ...current,
                bookings: current.bookings.filter((booking) => booking.id !== id),
              }
            : current
        )
      },
      addExpense: (input) => {
        const expense: Expense = { ...input, id: crypto.randomUUID() }
        setState((current) =>
          current ? { ...current, expenses: [expense, ...current.expenses] } : current
        )
      },
      invitePartner: (partnerId, note, accepted) => {
        const next: Partnership = {
          partnerId,
          status: accepted ? "diterima" : "diminta",
          note,
          createdAt: new Date().toISOString(),
        }
        setState((current) => {
          if (!current) return current
          const rest = current.partnerships.filter((item) => item.partnerId !== partnerId)
          return { ...current, partnerships: [next, ...rest] }
        })
      },
      acceptPartner: (partnerId) => {
        setState((current) =>
          current
            ? {
                ...current,
                partnerships: current.partnerships.map((item) =>
                  item.partnerId === partnerId ? { ...item, status: "diterima" } : item
                ),
              }
            : current
        )
      },
      addCombo: (input) => {
        const combo: Combo = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        setState((current) =>
          current ? { ...current, combos: [combo, ...current.combos] } : current
        )
        return combo
      },
      removeCombo: (id) => {
        setState((current) =>
          current
            ? { ...current, combos: current.combos.filter((combo) => combo.id !== id) }
            : current
        )
      },
      reset: () => {
        setState(createSeed())
        setNotice("Data contoh Laras Bridal sudah dikembalikan.")
      },
    }
  }, [notice, ready, state])

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio() {
  const context = useContext(StudioContext)
  if (!context) {
    throw new Error("useStudio harus dipakai di dalam StudioProvider")
  }
  return context
}
