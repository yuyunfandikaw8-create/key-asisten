"use client"

import { useEffect, useRef, useState } from "react"
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

function openNativePicker(el: HTMLInputElement | null) {
  if (!el) return
  try {
    if (typeof el.showPicker === "function") {
      void el.showPicker()
      return
    }
  } catch {
    // NotAllowedError / unsupported — fall through
  }
  el.focus()
  el.click()
}

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
  const datePickerRef = useRef<HTMLInputElement>(null)
  const timePickerRef = useRef<HTMLInputElement>(null)
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
        <Label htmlFor={`${dateId}-text`}>Tanggal jadwal</Label>

        <div className="flex gap-2">
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
            className={cn("h-11 min-w-0 flex-1 bg-background", inputClassName)}
            aria-invalid={Boolean(dateError)}
          />
          <div className="relative h-11 w-11 shrink-0">
            <span
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center rounded-lg border border-input bg-background"
              aria-hidden
            >
              <CalendarDays className="size-4" />
            </span>
            <input
              ref={datePickerRef}
              id={dateId}
              type="date"
              value={date || ""}
              aria-label="Pilih tanggal dari kalender"
              onClick={(event) => openNativePicker(event.currentTarget)}
              onChange={(event) => {
                const next = event.target.value
                if (!next) return
                setDateError("")
                setDateText(formatDateInput(next))
                onDateChange(next)
              }}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${timeId}-text`}>Jam</Label>

        <div className="flex gap-2">
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
            className={cn("h-11 min-w-0 flex-1 bg-background", inputClassName)}
            aria-invalid={Boolean(timeError)}
          />
          <div className="relative h-11 w-11 shrink-0">
            <span
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center rounded-lg border border-input bg-background"
              aria-hidden
            >
              <Clock3 className="size-4" />
            </span>
            <input
              ref={timePickerRef}
              id={timeId}
              type="time"
              value={time || ""}
              aria-label="Pilih jam dari picker"
              onClick={(event) => openNativePicker(event.currentTarget)}
              onChange={(event) => {
                const next = event.target.value
                if (!next) return
                setTimeError("")
                setTimeText(formatTime(next))
                onTimeChange(next)
              }}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        {timeError ? <p className="text-xs text-destructive">{timeError}</p> : null}
      </div>
    </div>
  )
}
