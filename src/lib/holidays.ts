/** Hari libur nasional Indonesia (SKB 3 Menteri) + cuti bersama. */

export type HolidayKind = "nasional" | "cuti"

export type Holiday = {
  date: string // YYYY-MM-DD
  name: string
  kind: HolidayKind
}

const FIXED_NATIONAL: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Tahun Baru Masehi" },
  { month: 5, day: 1, name: "Hari Buruh Internasional" },
  { month: 6, day: 1, name: "Hari Lahir Pancasila" },
  { month: 8, day: 17, name: "Hari Proklamasi Kemerdekaan" },
  { month: 12, day: 25, name: "Hari Natal" },
]

/** Libur nasional bergerak + cuti bersama per tahun (sumber: Kemenko PMK / SKB). */
const YEARLY: Record<number, Holiday[]> = {
  2025: [
    { date: "2025-01-27", name: "Isra Mikraj Nabi Muhammad SAW", kind: "nasional" },
    { date: "2025-01-28", name: "Cuti bersama Imlek", kind: "cuti" },
    { date: "2025-01-29", name: "Tahun Baru Imlek", kind: "nasional" },
    { date: "2025-03-28", name: "Cuti bersama Nyepi", kind: "cuti" },
    { date: "2025-03-29", name: "Hari Suci Nyepi", kind: "nasional" },
    { date: "2025-03-31", name: "Idul Fitri 1446 H", kind: "nasional" },
    { date: "2025-04-01", name: "Idul Fitri 1446 H", kind: "nasional" },
    { date: "2025-04-02", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2025-04-03", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2025-04-04", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2025-04-07", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2025-04-18", name: "Wafat Yesus Kristus", kind: "nasional" },
    { date: "2025-04-20", name: "Hari Paskah", kind: "nasional" },
    { date: "2025-05-12", name: "Hari Raya Waisak", kind: "nasional" },
    { date: "2025-05-13", name: "Cuti bersama Waisak", kind: "cuti" },
    { date: "2025-05-29", name: "Kenaikan Yesus Kristus", kind: "nasional" },
    { date: "2025-05-30", name: "Cuti bersama Kenaikan Yesus Kristus", kind: "cuti" },
    { date: "2025-06-06", name: "Idul Adha 1446 H", kind: "nasional" },
    { date: "2025-06-09", name: "Cuti bersama Idul Adha", kind: "cuti" },
    { date: "2025-06-27", name: "Tahun Baru Islam 1447 H", kind: "nasional" },
    { date: "2025-09-05", name: "Maulid Nabi Muhammad SAW", kind: "nasional" },
    { date: "2025-12-26", name: "Cuti bersama Natal", kind: "cuti" },
  ],
  2026: [
    { date: "2026-01-16", name: "Isra Mikraj Nabi Muhammad SAW", kind: "nasional" },
    { date: "2026-02-16", name: "Cuti bersama Imlek", kind: "cuti" },
    { date: "2026-02-17", name: "Tahun Baru Imlek", kind: "nasional" },
    { date: "2026-03-18", name: "Cuti bersama Nyepi", kind: "cuti" },
    { date: "2026-03-19", name: "Hari Suci Nyepi", kind: "nasional" },
    { date: "2026-03-20", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2026-03-21", name: "Idul Fitri 1447 H", kind: "nasional" },
    { date: "2026-03-22", name: "Idul Fitri 1447 H", kind: "nasional" },
    { date: "2026-03-23", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2026-03-24", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2026-04-03", name: "Wafat Yesus Kristus", kind: "nasional" },
    { date: "2026-04-05", name: "Hari Paskah", kind: "nasional" },
    { date: "2026-05-14", name: "Kenaikan Yesus Kristus", kind: "nasional" },
    { date: "2026-05-15", name: "Cuti bersama Kenaikan Yesus Kristus", kind: "cuti" },
    { date: "2026-05-27", name: "Idul Adha 1447 H", kind: "nasional" },
    { date: "2026-05-28", name: "Cuti bersama Idul Adha", kind: "cuti" },
    { date: "2026-05-31", name: "Hari Raya Waisak", kind: "nasional" },
    { date: "2026-06-16", name: "Tahun Baru Islam 1448 H", kind: "nasional" },
    { date: "2026-08-25", name: "Maulid Nabi Muhammad SAW", kind: "nasional" },
    { date: "2026-12-24", name: "Cuti bersama Natal", kind: "cuti" },
  ],
  2027: [
    { date: "2027-01-05", name: "Isra Mikraj Nabi Muhammad SAW", kind: "nasional" },
    { date: "2027-02-05", name: "Cuti bersama Imlek", kind: "cuti" },
    { date: "2027-02-06", name: "Tahun Baru Imlek", kind: "nasional" },
    { date: "2027-03-08", name: "Hari Suci Nyepi", kind: "nasional" },
    { date: "2027-03-09", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2027-03-10", name: "Idul Fitri 1448 H", kind: "nasional" },
    { date: "2027-03-11", name: "Idul Fitri 1448 H", kind: "nasional" },
    { date: "2027-03-12", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2027-03-15", name: "Cuti bersama Idul Fitri", kind: "cuti" },
    { date: "2027-03-25", name: "Cuti bersama Wafat Yesus Kristus", kind: "cuti" },
    { date: "2027-03-26", name: "Wafat Yesus Kristus", kind: "nasional" },
    { date: "2027-03-28", name: "Hari Paskah", kind: "nasional" },
    { date: "2027-05-06", name: "Kenaikan Yesus Kristus", kind: "nasional" },
    { date: "2027-05-17", name: "Idul Adha 1448 H", kind: "nasional" },
    { date: "2027-05-18", name: "Cuti bersama Idul Adha", kind: "cuti" },
    { date: "2027-05-19", name: "Cuti bersama Waisak", kind: "cuti" },
    { date: "2027-05-20", name: "Hari Raya Waisak", kind: "nasional" },
    { date: "2027-06-06", name: "Tahun Baru Islam 1449 H", kind: "nasional" },
    { date: "2027-08-15", name: "Maulid Nabi Muhammad SAW", kind: "nasional" },
    { date: "2027-12-24", name: "Cuti bersama Natal", kind: "cuti" },
    { date: "2027-12-26", name: "Isra Mikraj Nabi Muhammad SAW", kind: "nasional" },
  ],
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function fixedForYear(year: number): Holiday[] {
  return FIXED_NATIONAL.map((item) => ({
    date: `${year}-${pad(item.month)}-${pad(item.day)}`,
    name: item.name,
    kind: "nasional" as const,
  }))
}

export function holidaysForYear(year: number): Holiday[] {
  const yearly = YEARLY[year] ?? []
  const merged = new Map<string, Holiday>()
  for (const item of [...fixedForYear(year), ...yearly]) {
    const existing = merged.get(item.date)
    if (!existing || (existing.kind === "cuti" && item.kind === "nasional")) {
      merged.set(item.date, item)
    }
  }
  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function holidayMapForYear(year: number): Map<string, Holiday> {
  return new Map(holidaysForYear(year).map((item) => [item.date, item]))
}

export function holidaysInMonth(year: number, monthIndex: number): Holiday[] {
  const prefix = `${year}-${pad(monthIndex + 1)}-`
  return holidaysForYear(year).filter((item) => item.date.startsWith(prefix))
}

export function getHoliday(iso: string): Holiday | undefined {
  const year = Number(iso.slice(0, 4))
  if (!Number.isFinite(year)) return undefined
  return holidayMapForYear(year).get(iso)
}
