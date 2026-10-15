import { packages } from "@/lib/catalog"
import { addDays, todayISO } from "@/lib/format"
import type { EventType } from "@/lib/types"

const MONTHS: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  agu: 8,
  agt: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  des: 12,
}

const NAME_STOP =
  /^(mau|ingin|dari|tanggal|jam|lokasi|paket|hp|nomor|booking|rias|pengantin|wisuda|besok|hari|ya|kak|kakak|dong|yaa)$/i

export type ParsedChat = {
  clientName?: string
  phone?: string
  date?: string
  time?: string
  location?: string
  packageId?: string
  eventType?: EventType
  found: string[]
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function cleanName(raw: string) {
  const parts = raw.trim().split(/\s+/)
  const kept: string[] = []
  for (const part of parts) {
    if (NAME_STOP.test(part)) break
    kept.push(part)
    if (kept.length === 3) break
  }
  if (!kept.length) return undefined
  return kept
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function trimLocation(value: string) {
  return value
    .split(/\b(?:hp|nomor|wa|whatsapp|paket|jam|pukul)\b/i)[0]
    .replace(/(?:\+62|62|0)8\d[\d\s.\-]{6,}.*/, "")
    .replace(/[.,]$/, "")
    .trim()
}

function isoDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const fullYear = year < 100 ? 2000 + year : year
  return `${fullYear}-${pad(month)}-${pad(day)}`
}

export function parseChat(text: string): ParsedChat {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const flat = lines.join(" ")
  const lower = flat.toLowerCase()
  const found: string[] = []
  const result: ParsedChat = { found }

  const nameMatch = flat.match(
    /(?:nama(?:\s+saya)?|saya|aku|perkenalkan)\s+([A-Za-z][A-Za-z.'’\-]*(?:\s+[A-Za-z][A-Za-z.'’\-]*){0,3})/i
  )
  const clientName = nameMatch ? cleanName(nameMatch[1]) : undefined
  if (clientName) {
    result.clientName = clientName
    found.push("Nama")
  }

  const phoneMatch = flat.match(/(?:\+62|62|0)8\d[\d\s.\-]{7,16}/)
  if (phoneMatch) {
    let digits = phoneMatch[0].replace(/\D/g, "")
    if (digits.startsWith("62")) digits = `0${digits.slice(2)}`
    result.phone = digits
    found.push("Nomor")
  }

  const monthPattern = Object.keys(MONTHS)
    .sort((a, b) => b.length - a.length)
    .join("|")
  const wordDate = flat.match(
    new RegExp(`(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})`, "i")
  )
  const numericDate = flat.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (wordDate) {
    const month = MONTHS[wordDate[2].toLowerCase()]
    result.date = isoDate(Number(wordDate[3]), month, Number(wordDate[1]))
  } else if (numericDate) {
    result.date = isoDate(
      Number(numericDate[3]),
      Number(numericDate[2]),
      Number(numericDate[1])
    )
  } else if (/\blusa\b/i.test(flat)) {
    result.date = addDays(todayISO(), 2)
  } else if (/\bbesok\b/i.test(flat)) {
    result.date = addDays(todayISO(), 1)
  } else if (/\bhari ini\b/i.test(flat)) {
    result.date = todayISO()
  }
  if (result.date) found.push("Tanggal")

  const clock = flat.match(/(?:jam|pukul)\s*(\d{1,2})(?:[.:](\d{2}))?/i)
  const withZone = flat.match(/\b(\d{1,2})[.:](\d{2})\s*(?:wib|wita|wit)\b/i)
  const timeMatch = clock ?? withZone
  if (timeMatch) {
    const hour = Number(timeMatch[1])
    const minute = Number(timeMatch[2] ?? "0")
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      result.time = `${pad(hour)}:${pad(minute)}`
      found.push("Jam")
    }
  }

  const locationLine = lines.find((line) => /^(lokasi|alamat|tempat)\b/i.test(line))
  if (locationLine) {
    result.location = trimLocation(
      locationLine.replace(/^(lokasi|alamat|tempat)\s*(?:di|:|-)?\s*/i, "")
    )
    found.push("Lokasi")
  } else {
    const place = flat.match(
      /\bdi\s+((?:gedung|hotel|rumah|masjid|gereja|balai|graha|villa)\s+.+)/i
    )
    if (place) {
      result.location = trimLocation(place[1])
      found.push("Lokasi")
    }
  }
  if (!result.location) {
    delete result.location
    const locationIndex = found.indexOf("Lokasi")
    if (locationIndex >= 0) found.splice(locationIndex, 1)
  }

  if (/\b(adat|paes)\b/.test(lower)) result.packageId = "adat"
  else if (/\b(emas|gold)\b/.test(lower)) result.packageId = "emas"
  else if (/\b(perak|silver)\b/.test(lower)) result.packageId = "perak"
  else if (/paket\s+wisuda/.test(lower)) result.packageId = "wisuda"
  if (result.packageId && packages.some((item) => item.id === result.packageId)) {
    found.push("Paket")
  } else {
    result.packageId = undefined
  }

  if (/\bpre-?wedding\b/.test(lower)) result.eventType = "prewedding"
  else if (/\b(engagement|lamaran)\b/.test(lower)) result.eventType = "engagement"
  else if (/\b(pesta|party)\b/.test(lower)) result.eventType = "pesta"
  else if (/\bwisuda\b/.test(lower)) result.eventType = "wisuda"
  else if (/\bakad\b/.test(lower) && !/\bpengantin\b/.test(lower)) result.eventType = "akad"
  else if (/\b(pengantin|akad|nikah)\b/.test(lower)) result.eventType = "pengantin"
  if (result.eventType) found.push("Acara")

  return result
}
