export function normalizeRut(value: string): string {
  const compact = value.replace(/[.\s-]/g, "").toUpperCase()
  return /^\d{1,8}[\dK]$/.test(compact)
    ? `${compact.slice(0, -1)}-${compact.slice(-1)}`
    : compact
}

export function isValidRut(value: string): boolean {
  const normalized = normalizeRut(value)
  if (!/^\d{7,8}-[\dK]$/.test(normalized)) return false

  const [body, digit] = normalized.split("-")
  if (Number(body) < 1_000_000) return false

  const sum = [...body].reverse().reduce((total, number, index) => (
    total + Number(number) * (2 + index % 6)
  ), 0)
  const checkDigit = (11 - sum % 11) % 11
  return digit === (checkDigit === 10 ? "K" : String(checkDigit))
}
