"use client"

import { useEffect, useRef, useState } from "react"
import { CalendarDays, Clock3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDateInput, formatTime, parseDateInput, parseTimeInput } from "@/lib/format"
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

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker()
      return
    }
  } catch {
    // Some browsers block showPicker without a direct gesture; fall through.
  }
  input.focus()
  input.click()
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
    const parsed = parseDateInput(raw)
    if (!parsed) {
      setDateError("Contoh: 22/10/2026 atau 2026-10-22")
      setDateText(formatDateInput(date))
      return
    }
    setDateError("")
    setDateText(formatDateInput(parsed))
    if (parsed !== date) onDateChange(parsed)
  }

  function commitTime(raw: string) {
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
        <div className="relative flex gap-2">
          <Input
            id={dateId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="22/10/2026"
            value={dateText}
            onChange={(event) => {
              setDateText(event.target.value)
              if (dateError) setDateError("")
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("h-10 w-10 shrink-0", inputClassName)}
            aria-label="Pilih tanggal dari kalender"
            onClick={() => openNativePicker(datePickerRef.current)}
          >
            <CalendarDays className="size-4" />
          </Button>
          <input
            ref={datePickerRef}
            type="date"
            value={date}
            tabIndex={-1}
            aria-hidden
            className="sr-only"
            onChange={(event) => {
              const next = event.target.value
              if (!next) return
              setDateError("")
              setDateText(formatDateInput(next))
              onDateChange(next)
            }}
          />
        </div>
        <p className={cn("text-xs", dateError ? "text-destructive" : "text-muted-foreground")}>
          {dateError || "Ketik manual atau pakai ikon kalender"}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={timeId}>Jam</Label>
        <div className="relative flex gap-2">
          <Input
            id={timeId}
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("h-10 w-10 shrink-0", inputClassName)}
            aria-label="Pilih jam dari picker"
            onClick={() => openNativePicker(timePickerRef.current)}
          >
            <Clock3 className="size-4" />
          </Button>
          <input
            ref={timePickerRef}
            type="time"
            value={time}
            tabIndex={-1}
            aria-hidden
            className="sr-only"
            onChange={(event) => {
              const next = event.target.value
              if (!next) return
              setTimeError("")
              setTimeText(formatTime(next))
              onTimeChange(next)
            }}
          />
        </div>
        <p className={cn("text-xs", timeError ? "text-destructive" : "text-muted-foreground")}>
          {timeError || "Ketik manual atau pakai ikon jam"}
        </p>
      </div>
    </div>
  )
}
