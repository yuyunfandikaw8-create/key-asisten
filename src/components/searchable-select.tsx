"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SearchableOption = {
  value: string
  label: string
  /** Extra words to match while typing */
  keywords?: string
}

type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SearchableOption[]
  placeholder?: string
  emptyText?: string
  id?: string
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matchesQuery(option: SearchableOption, query: string) {
  const q = normalize(query)
  if (!q) return true
  const haystack = normalize(`${option.label} ${option.keywords ?? ""} ${option.value}`)
  return q.split(/\s+/).every((part) => haystack.includes(part))
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Cari atau pilih…",
  emptyText = "Tidak ada hasil.",
  id,
  className,
  disabled,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const results = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query]
  )

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "")
    }
  }, [open, selected?.label, value])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function pick(next: string) {
    onChange(next)
    setOpen(false)
    const label = options.find((option) => option.value === next)?.label ?? ""
    setQuery(label)
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="text"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? query)}
          onFocus={() => {
            setOpen(true)
            setQuery("")
          }}
          onClick={() => {
            setOpen(true)
            if (!open) setQuery("")
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!open) setOpen(true)
          }}
          className="h-10 bg-background pr-9 pl-9"
        />
        <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50" />
      </div>

      {open ? (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-foreground/5">
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? placeholder}
            className="max-h-56 overflow-y-auto p-1"
          >
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
            ) : (
              results.map((option) => {
                const active = option.value === value
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pick(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {active ? <Check className="size-3.5 shrink-0" /> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
