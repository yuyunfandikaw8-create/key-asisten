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
import type { Booking, Expense, NewBooking, StudioState } from "@/lib/types"

const STORAGE_KEY = "riasaja.laras.v1"

type StudioContextValue = {
  ready: boolean
  notice: string | null
  dismissNotice: () => void
  bookings: Booking[]
  expenses: Expense[]
  addBooking: (input: NewBooking) => Booking
  updateBooking: (id: string, patch: Partial<Booking>) => void
  removeBooking: (id: string) => void
  addExpense: (input: Omit<Expense, "id">) => void
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
          const parsed = JSON.parse(raw) as StudioState
          if (!Array.isArray(parsed.bookings) || !Array.isArray(parsed.expenses)) {
            throw new Error("Data studio tidak lengkap")
          }
          setState(parsed)
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
