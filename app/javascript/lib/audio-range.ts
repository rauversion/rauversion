export type AudioRange = [number, number]
export type RangePart = "start" | "end" | "selection"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round = (value: number) => Math.round(value * 1000) / 1000

// Round down so the selection never extends past the source duration.
export const rangeLimit = (duration: number) => Number.isFinite(duration) ? Math.max(0, Math.floor(duration * 1000) / 1000) : 0

export function normalizeAudioRange(value: AudioRange, duration: number): AudioRange {
  const max = rangeLimit(duration)
  const gap = Math.min(0.1, max)
  const requestedStart = round(Number.isFinite(value[0]) ? value[0] : 0)
  const requestedEnd = round(Number.isFinite(value[1]) ? value[1] : requestedStart + 30)
  const length = clamp(round(requestedEnd - requestedStart), gap, max)
  const start = clamp(requestedStart, 0, max - length)
  return [round(start), round(start + length)]
}

export function moveAudioRange(value: AudioRange, delta: number, duration: number): AudioRange {
  const [start, end] = normalizeAudioRange(value, duration)
  const length = round(end - start)
  const nextStart = clamp(round(start + delta), 0, rangeLimit(duration) - length)
  return [round(nextStart), round(nextStart + length)]
}

export function resizeAudioRange(value: AudioRange, part: "start" | "end", time: number, duration: number): AudioRange {
  const [start, end] = normalizeAudioRange(value, duration)
  const max = rangeLimit(duration)
  const gap = Math.min(0.1, max)
  return part === "start"
    ? [round(clamp(time, 0, end - gap)), end]
    : [start, round(clamp(time, start + gap, max))]
}

export function setAudioRangeDuration(value: AudioRange, length: number, duration: number): AudioRange {
  const max = rangeLimit(duration)
  const safeLength = clamp(round(length), Math.min(0.1, max), max)
  const start = clamp(value[0], 0, max - safeLength)
  return [round(start), round(start + safeLength)]
}

export function formatAudioTime(seconds: number, precision = 1): string {
  const units = 10 ** precision
  const total = Math.round(Math.max(0, seconds) * units)
  const minutes = Math.floor(total / (60 * units))
  const remainder = ((total % (60 * units)) / units).toFixed(precision).padStart(precision ? precision + 3 : 2, "0")
  return `${minutes}:${remainder}`
}

export function parseAudioTime(value: string): number | null {
  const parts = value.trim().split(":")
  if (parts.length > 3 || parts.some((part) => !/^\d+(?:\.\d{1,3})?$/.test(part))) return null
  const numbers = parts.map(Number)
  if (numbers.some((part) => !Number.isFinite(part))) return null
  if (numbers.slice(1).some((part) => part >= 60)) return null
  if (numbers.slice(0, -1).some((part) => !Number.isInteger(part))) return null
  return round(numbers.reduce((total, part) => total * 60 + part, 0))
}
