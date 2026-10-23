"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { searchCities } from "@/lib/cities"
import { cn } from "@/lib/utils"

type CitySearchPickerProps = {
  value: string
  onChange: (city: string) => void
  id?: string
  placeholder?: string
  /** Compact trigger for studio header — opens a dialog (more reliable than popover). */
  compact?: boolean
  className?: string
  required?: boolean
  disabled?: boolean
  "aria-label"?: string
}

function CityResults({
  listId,
  value,
  query,
  results,
  onPick,
}: {
  listId: string
  value: string
  query: string
  results: string[]
  onPick: (city: string) => void
}) {
  return (
    <>
      <ul
        id={listId}
        role="listbox"
        aria-label="Hasil pencarian wilayah"
        className="max-h-64 overflow-y-auto p-1"
      >
        {results.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            Wilayah tidak ditemukan. Coba kata lain.
          </li>
        ) : (
          results.map((city) => {
            const selected = city === value
            return (
              <li key={city}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onPick(city)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                    selected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{city}</span>
                  {selected ? <Check className="size-3.5 shrink-0" /> : null}
                </button>
              </li>
            )
          })
        )}
      </ul>
      {query.trim() && results.length > 0 ? (
        <p className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
          {results.length} wilayah cocok
        </p>
      ) : null}
    </>
  )
}

function TriggerLabel({
  value,
  placeholder,
}: {
  value: string
  placeholder: string
}) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5">
        <MapPin className="size-3.5 shrink-0 text-primary" />
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
      </span>
      <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
    </>
  )
}

function CompactCitySearchPicker({
  value,
  onChange,
  id,
  placeholder,
  className,
  disabled,
  ariaLabel,
}: {
  value: string
  onChange: (city: string) => void
  id?: string
  placeholder: string
  className?: string
  disabled?: boolean
  ariaLabel: string
}) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const results = useMemo(
    () => searchCities(query, { limit: 60, extra: value ? [value] : [] }),
    [query, value]
  )

  function pick(city: string) {
    onChange(city)
    setOpen(false)
    setQuery("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "h-8 w-[9.5rem] justify-between gap-2 bg-card px-2.5 text-xs font-normal sm:w-44 sm:text-sm",
          className
        )}
      >
        <TriggerLabel value={value} placeholder={placeholder} />
      </Button>
      {open ? (
        <DialogContent className="gap-3 sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Pilih wilayah</DialogTitle>
            <DialogDescription>
              Cari kabupaten atau kota untuk partner dan inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ketik nama kota / kabupaten…"
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              autoComplete="off"
            />
          </div>
          <div className="overflow-hidden rounded-xl border">
            <CityResults
              listId={listId}
              value={value}
              query={query}
              results={results}
              onPick={pick}
            />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

function InlineCitySearchPicker({
  value,
  onChange,
  id,
  placeholder,
  className,
  required,
  disabled,
  ariaLabel,
}: {
  value: string
  onChange: (city: string) => void
  id?: string
  placeholder: string
  className?: string
  required?: boolean
  disabled?: boolean
  ariaLabel: string
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const results = useMemo(
    () => searchCities(query, { limit: 60, extra: value ? [value] : [] }),
    [query, value]
  )

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function pick(city: string) {
    onChange(city)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="h-10 w-full justify-between gap-2 px-3 text-sm font-normal"
      >
        <TriggerLabel value={value} placeholder={placeholder} />
      </Button>

      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value}
          onChange={() => undefined}
          required
        />
      ) : null}

      {open ? (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-foreground/5">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ketik nama kota / kabupaten…"
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              autoComplete="off"
            />
          </div>
          <CityResults
            listId={listId}
            value={value}
            query={query}
            results={results}
            onPick={pick}
          />
        </div>
      ) : null}
    </div>
  )
}

export function CitySearchPicker({
  value,
  onChange,
  id,
  placeholder = "Cari wilayah / kota",
  compact = false,
  className,
  required,
  disabled,
  "aria-label": ariaLabel = "Pilih wilayah",
}: CitySearchPickerProps) {
  if (compact) {
    return (
      <CompactCitySearchPicker
        value={value}
        onChange={onChange}
        id={id}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        ariaLabel={ariaLabel}
      />
    )
  }

  return (
    <InlineCitySearchPicker
      value={value}
      onChange={onChange}
      id={id}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      ariaLabel={ariaLabel}
    />
  )
}
