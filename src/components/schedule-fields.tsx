"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Clock3 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  formatDateInput,
  formatTime,
  maskDateDigits,
  parseDateInput,
  parseTimeInput,
} from "@/lib/format"
import { cn } from "@/lib/utils"

type ScheduleFieldsProps = {
  date: string
  time: string
  onDateChange: (isoDate: string) => void
  onTimeChange: (hhmm: string) => void
  dateId?: string
  timeId?: string
  className?: string
  inputClassName?: string
}

const fieldClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"

export function ScheduleFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateId = "tanggal",
  timeId = "jam",
  className,
  inputClassName,
}: ScheduleFieldsProps) {
  const [dateText, setDateText] = useState(() => formatDateInput(date))
  const [timeText, setTimeText] = useState(() => formatTime(time))
  const [dateError, setDateError] = useState("")
  const [timeError, setTimeError] = useState("")

  useEffect(() => {
    setDateText(formatDateInput(date))
    setDateError("")
  }, [date])

  useEffect(() => {
    setTimeText(formatTime(time))
    setTimeError("")
  }, [time])

  function commitDate(raw: string) {
    if (!raw.trim()) {
      setDateError("")
      setDateText("")
      if (date) onDateChange("")
      return
    }
    const parsed = parseDateInput(raw)
    if (!parsed) {
      setDateError("Contoh: 22/10/2026 atau ketik 22102026")
      setDateText(formatDateInput(date))
      return
    }
    setDateError("")
    setDateText(formatDateInput(parsed))
    if (parsed !== date) onDateChange(parsed)
  }

  function commitTime(raw: string) {
    if (!raw.trim()) {
      setTimeError("")
      setTimeText("")
      if (time) onTimeChange("")
      return
    }
    const parsed = parseTimeInput(raw)
    if (!parsed) {
      setTimeError("Contoh: 08.00 atau 08:00")
      setTimeText(formatTime(time))
      return
    }
    setTimeError("")
    setTimeText(formatTime(parsed))
    if (parsed !== time) onTimeChange(parsed)
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <div className="grid gap-1.5">
        <Label htmlFor={dateId}>Tanggal jadwal</Label>

        {/* HP: pakai date native — paling andal di Safari/Chrome mobile */}
        <div className="relative sm:hidden">
          <CalendarDays
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id={dateId}
            type="date"
            value={date}
            onChange={(event) => {
              const next = event.target.value
              setDateError("")
              setDateText(next ? formatDateInput(next) : "")
              onDateChange(next)
            }}
            className={cn(fieldClass, "pl-10", inputClassName)}
          />
        </div>

        {/* Desktop: ketik + ikon kalender (input date menumpuk di ikon) */}
        <div className="relative hidden gap-2 sm:flex">
          <Input
            id={`${dateId}-text`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="22/10/2026"
            value={dateText}
            onChange={(event) => {
              const next = maskDateDigits(event.target.value)
              setDateText(next)
              if (dateError) setDateError("")
              const parsed = parseDateInput(next)
              if (parsed && parsed !== date) onDateChange(parsed)
            }}
            onBlur={(event) => commitDate(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitDate((event.target as HTMLInputElement).value)
              }
            }}
            className={cn("h-10 min-w-0 flex-1", inputClassName)}
            aria-invalid={Boolean(dateError)}
          />
          <div className="relative h-10 w-10 shrink-0">
            <span
              className={cn(
                "pointer-events-none absolute inset-0 z-0 flex items-center justify-center rounded-lg border border-border bg-background",
                inputClassName
              )}
              aria-hidden
            >
              <CalendarDays className="size-4" />
            </span>
            <input
              type="date"
              value={date}
              aria-label="Pilih tanggal dari kalender"
              onChange={(event) => {
                const next = event.target.value
                if (!next) return
                setDateError("")
                setDateText(formatDateInput(next))
                onDateChange(next)
              }}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={timeId}>Jam</Label>

        <div className="relative sm:hidden">
          <Clock3
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id={timeId}
            type="time"
            value={time}
            onChange={(event) => {
              const next = event.target.value
              setTimeError("")
              setTimeText(next ? formatTime(next) : "")
              onTimeChange(next)
            }}
            className={cn(fieldClass, "pl-10", inputClassName)}
          />
        </div>

        <div className="relative hidden gap-2 sm:flex">
          <Input
            id={`${timeId}-text`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="08.00"
            value={timeText}
            onChange={(event) => {
              setTimeText(event.target.value)
              if (timeError) setTimeError("")
            }}
            onBlur={(event) => commitTime(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitTime((event.target as HTMLInputElement).value)
              }
            }}
            className={cn("h-10 min-w-0 flex-1", inputClassName)}
            aria-invalid={Boolean(timeError)}
          />
          <div className="relative h-10 w-10 shrink-0">
            <span
              className={cn(
                "pointer-events-none absolute inset-0 z-0 flex items-center justify-center rounded-lg border border-border bg-background",
                inputClassName
              )}
              aria-hidden
            >
              <Clock3 className="size-4" />
            </span>
            <input
              type="time"
              value={time}
              aria-label="Pilih jam dari picker"
              onChange={(event) => {
                const next = event.target.value
                if (!next) return
                setTimeError("")
                setTimeText(formatTime(next))
                onTimeChange(next)
              }}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {timeError ? <p className="text-xs text-destructive">{timeError}</p> : null}
      </div>
    </div>
  )
}
