"use client"

import { useMemo, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SuggestOption = {
  value: string
  label: string
  hint?: string
}

type SuggestInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onPick?: (option: SuggestOption) => void
  options: SuggestOption[]
  placeholder?: string
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  filterDigits?: boolean
  disabled?: boolean
  emptyText?: string
  "aria-label"?: string
}

export function SuggestInput({
  id,
  value,
  onChange,
  onPick,
  options,
  placeholder,
  className,
  inputMode,
  filterDigits,
  disabled,
  emptyText = "Tidak ada di daftar — teks bebas tetap bisa dipakai.",
  "aria-label": ariaLabel,
}: SuggestInputProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase()
    if (!needle) return options.slice(0, 12)
    return options
      .filter((option) => {
        const haystack = `${option.label} ${option.value} ${option.hint ?? ""}`.toLowerCase()
        return haystack.includes(needle)
      })
      .slice(0, 12)
  }, [options, value])

  const exact = options.some(
    (option) => option.value.toLowerCase() === value.trim().toLowerCase()
  )

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={id}
        value={value}
        aria-label={ariaLabel}
        inputMode={inputMode}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("h-10 bg-background", className)}
        autoComplete="off"
        onFocus={() => {
          if (!disabled) setOpen(true)
        }}
        onBlur={() => {
          // Delay supaya klik opsi sempat terproses.
          window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) setOpen(false)
          }, 120)
        }}
        onChange={(event) => {
          const next = filterDigits
            ? event.target.value.replace(/\D/g, "")
            : event.target.value
          onChange(next)
          setOpen(true)
        }}
      />
      {open && !disabled && options.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border bg-card shadow-md">
          {filtered.length ? (
            filtered.map((option) => (
              <button
                key={`${option.value}-${option.hint ?? ""}`}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/70"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value)
                  onPick?.(option)
                  setOpen(false)
                }}
              >
                <span className="font-medium">{option.label}</span>
                {option.hint ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">{emptyText}</p>
          )}
          {value.trim() && !exact ? (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              Pakai isian manual: “{value.trim()}”
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
