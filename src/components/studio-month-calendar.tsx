"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { holidaysInMonth, holidayMapForYear } from "@/lib/holidays"
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
  const year = cursor.getFullYear()
  const monthIndex = cursor.getMonth()

  const holidayByDate = useMemo(() => holidayMapForYear(year), [year])
  const monthHolidays = useMemo(
    () => holidaysInMonth(year, monthIndex),
    [year, monthIndex]
  )

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(cursor)

  const cells = useMemo(() => {
    const first = new Date(year, monthIndex, 1)
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const total = Math.ceil((offset + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, index) => {
      const day = index - offset + 1
      if (day < 1 || day > daysInMonth) return null
      return toISODate(new Date(year, monthIndex, day))
    })
  }, [year, monthIndex])

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
          const holiday = holidayByDate.get(iso)
          const isHoliday = Boolean(holiday)
          return (
            <button
              key={iso}
              type="button"
              title={holiday ? `${holiday.name}${holiday.kind === "cuti" ? " (cuti bersama)" : ""}` : undefined}
              onClick={() => onSelectDate(iso)}
              className={cn(
                "relative mx-auto flex size-9 items-center justify-center rounded-full transition",
                isSelected && "bg-primary font-semibold text-primary-foreground",
                !isSelected && isToday && "ring-1 ring-primary/40 font-semibold text-primary",
                !isSelected &&
                  isHoliday &&
                  holiday?.kind === "nasional" &&
                  "font-semibold text-[oklch(0.48_0.16_25)] hover:bg-[oklch(0.96_0.03_25)]",
                !isSelected &&
                  isHoliday &&
                  holiday?.kind === "cuti" &&
                  "font-semibold text-[oklch(0.5_0.12_55)] hover:bg-[oklch(0.97_0.03_55)]",
                !isSelected && !isToday && !isHoliday && "text-foreground hover:bg-accent"
              )}
            >
              {day}
              {hasEvent && !isSelected ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              ) : null}
              {isHoliday && !isSelected ? (
                <span
                  className={cn(
                    "absolute top-0.5 size-1 rounded-full",
                    holiday?.kind === "nasional"
                      ? "bg-[oklch(0.55_0.18_25)]"
                      : "bg-[oklch(0.62_0.14_55)]"
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="mt-3 border-t border-foreground/10 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[oklch(0.55_0.18_25)]" />
            Libur nasional
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[oklch(0.62_0.14_55)]" />
            Cuti bersama
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            Ada booking
          </span>
        </div>
        {monthHolidays.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tidak ada hari besar di bulan ini.</p>
        ) : (
          <ul className="grid gap-1.5">
            {monthHolidays.map((item) => (
              <li key={`${item.date}-${item.name}`}>
                <button
                  type="button"
                  onClick={() => onSelectDate(item.date)}
                  className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left text-xs transition hover:bg-accent/60"
                >
                  <span
                    className={cn(
                      "mt-0.5 w-8 shrink-0 font-semibold",
                      item.kind === "nasional"
                        ? "text-[oklch(0.48_0.16_25)]"
                        : "text-[oklch(0.5_0.12_55)]"
                    )}
                  >
                    {Number(item.date.slice(-2))}
                  </span>
                  <span className="min-w-0 flex-1 text-foreground">
                    {item.name}
                    {item.kind === "cuti" ? (
                      <span className="text-muted-foreground"> · cuti bersama</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
