"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const WEEKDAYS = ["S", "S", "R", "K", "J", "S", "M"] as const

function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function StudioMonthCalendar({
  markedDates,
  selectedDate,
  onSelectDate,
}: {
  markedDates: string[]
  selectedDate: string
  onSelectDate: (iso: string) => void
}) {
  const today = toISODate(new Date())
  const [cursor, setCursor] = useState(() => startOfMonth(new Date(`${selectedDate}T12:00:00`)))

  const marked = useMemo(() => new Set(markedDates), [markedDates])

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(cursor)

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const total = Math.ceil((offset + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, index) => {
      const day = index - offset + 1
      if (day < 1 || day > daysInMonth) return null
      return toISODate(new Date(year, month, day))
    })
  }, [cursor])

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => setCursor((current) => addMonths(current, -1))}
            className="inline-flex size-8 items-center justify-center rounded-full text-primary transition hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => setCursor((current) => addMonths(current, 1))}
            className="inline-flex size-8 items-center justify-center rounded-full text-primary transition hover:bg-accent"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-primary/70">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((iso, index) => {
          if (!iso) return <span key={`empty-${index}`} className="py-2" />
          const day = Number(iso.slice(-2))
          const isSelected = iso === selectedDate
          const isToday = iso === today
          const hasEvent = marked.has(iso)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={cn(
                "relative mx-auto flex size-9 items-center justify-center rounded-full transition",
                isSelected && "bg-primary font-semibold text-primary-foreground",
                !isSelected && isToday && "ring-1 ring-primary/40 font-semibold text-primary",
                !isSelected && !isToday && "text-foreground hover:bg-accent"
              )}
            >
              {day}
              {hasEvent && !isSelected ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
