"use client"

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchCities } from "@/lib/cities"
import { cn } from "@/lib/utils"

type CitySearchPickerProps = {
  value: string
  onChange: (city: string) => void
  id?: string
  placeholder?: string
  /** Compact trigger for studio header */
  compact?: boolean
  className?: string
  required?: boolean
  disabled?: boolean
  "aria-label"?: string
}

type PanelPos = { top: number; left: number; width: number }

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
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null)

  const results = useMemo(
    () => searchCities(query, { limit: 60, extra: value ? [value] : [] }),
    [query, value]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  function updatePanelPos() {
    const trigger = rootRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = compact
      ? Math.min(320, Math.max(rect.width, Math.min(window.innerWidth - 16, 280)))
      : Math.max(rect.width, 240)
    let left = compact ? rect.right - width : rect.left
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8)
    const top = rect.bottom + 4
    setPanelPos({ top, left, width })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPos()
    const onReposition = () => updatePanelPos()
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)
    return () => {
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open, compact])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
      setQuery("")
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }
    // Capture phase so sticky headers / overlays don't swallow the dismiss.
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function pick(city: string) {
    onChange(city)
    setOpen(false)
    setQuery("")
  }

  const panel =
    open && mounted && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            data-city-search-panel=""
            style={{
              position: "fixed",
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
              zIndex: 80,
            }}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-foreground/5"
          >
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
                        onPointerDown={(event) => {
                          // Prefer pointerdown so selection isn't lost if the panel closes early.
                          event.preventDefault()
                          event.stopPropagation()
                          pick(city)
                        }}
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
          </div>,
          document.body
        )
      : null

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
        onPointerDown={(event) => {
          // Keep the trigger click from being treated as an outside dismiss.
          event.stopPropagation()
        }}
        onClick={() => {
          setOpen((current) => {
            const next = !current
            if (!next) setQuery("")
            return next
          })
        }}
        className={cn(
          "relative z-[1] justify-between gap-2 font-normal",
          compact
            ? "h-8 w-[9.5rem] bg-card px-2.5 text-xs sm:w-44 sm:text-sm"
            : "h-10 w-full px-3 text-sm"
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
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

      {panel}
    </div>
  )
}
