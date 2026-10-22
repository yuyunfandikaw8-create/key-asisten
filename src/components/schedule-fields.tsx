"use client"

import { useEffect, useState } from "react"

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
          className={cn("h-10", inputClassName)}
          aria-invalid={Boolean(dateError)}
        />
        <p className={cn("text-xs", dateError ? "text-destructive" : "text-muted-foreground")}>
          {dateError || "Ketik manual, contoh 22/10/2026"}
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={timeId}>Jam</Label>
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
          className={cn("h-10", inputClassName)}
          aria-invalid={Boolean(timeError)}
        />
        <p className={cn("text-xs", timeError ? "text-destructive" : "text-muted-foreground")}>
          {timeError || "Ketik manual, contoh 08.00 atau 14:30"}
        </p>
      </div>
    </div>
  )
}
