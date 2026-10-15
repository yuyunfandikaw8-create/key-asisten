export const CITIES = [
  "Bandung",
  "Surabaya",
  "Jakarta",
  "Yogyakarta",
  "Semarang",
  "Medan",
  "Makassar",
  "Denpasar",
] as const

export type CityName = (typeof CITIES)[number]

export function isKnownCity(value: string): value is CityName {
  return (CITIES as readonly string[]).includes(value)
}
