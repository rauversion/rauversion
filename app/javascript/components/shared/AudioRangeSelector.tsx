import React, { useEffect, useId, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, GripVertical, Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import I18n from "stores/locales"
import {
  type AudioRange, type RangePart, formatAudioTime, moveAudioRange,
  normalizeAudioRange, parseAudioTime, rangeLimit, resizeAudioRange, setAudioRangeDuration,
} from "@/lib/audio-range"

interface Props {
  value: AudioRange
  totalDuration: number
  onValueChange: (start: number, end: number) => void
  resetValue?: AudioRange
  isPlaying?: boolean
  setIsPlaying?: (playing: boolean) => void
}

function TimeField({ label, value, revision, onChange }: { label: string; value: number; revision: number; onChange: (value: number) => void }) {
  const id = useId()
  const [draft, setDraft] = useState(formatAudioTime(value, 3))
  const [error, setError] = useState(false)
  const focused = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!focused.current) {
      setDraft(formatAudioTime(value, 3))
      setError(false)
      inputRef.current?.setCustomValidity("")
    }
  }, [value, revision])

  const commit = (input: HTMLInputElement) => {
    const parsed = parseAudioTime(input.value)
    if (parsed === null) {
      setError(true)
      input.setCustomValidity(I18n.t("audio_trim.invalid_time"))
      return
    }
    setError(false)
    input.setCustomValidity("")
    onChange(parsed)
    // The parent may clamp the input without changing its existing value.
    setDraft(formatAudioTime(value, 3))
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input ref={inputRef} id={id} value={draft} className="h-10 font-mono tabular-nums" required
        aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined}
        onFocus={() => { focused.current = true }}
        onChange={(event) => {
          setDraft(event.target.value)
          const invalid = parseAudioTime(event.target.value) === null
          event.target.setCustomValidity(invalid ? I18n.t("audio_trim.invalid_time") : "")
          setError(invalid)
        }}
        onBlur={(event) => { focused.current = false; commit(event.currentTarget) }}
        onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur() }
          if (event.key === "Escape") {
            event.stopPropagation()
            event.currentTarget.value = formatAudioTime(value, 3)
            event.currentTarget.blur()
          }
        }} />
      {error && <p id={`${id}-error`} className="text-xs text-destructive">{I18n.t("audio_trim.invalid_time")}</p>}
    </div>
  )
}

export default function AudioRangeSelector({ value, totalDuration, onValueChange, resetValue, isPlaying, setIsPlaying }: Props) {
  const max = rangeLimit(totalDuration)
  const range = normalizeAudioRange(value, max)
  const [start, end] = range
  const length = Math.round((end - start) * 1000) / 1000
  const gap = Math.min(0.1, max)
  const rail = useRef<HTMLDivElement>(null)
  const drag = useRef<{ part: RangePart; x: number; width: number; range: AudioRange; pointerId: number } | null>(null)
  const [dragging, setDragging] = useState<RangePart | null>(null)
  const [revision, setRevision] = useState(0)
  const hintId = useId()
  const percent = (time: number) => max ? time / max * 100 : 0
  const emit = (next: AudioRange) => {
    setRevision((previous) => previous + 1)
    onValueChange(...next)
  }

  const beginDrag = (part: RangePart, event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !rail.current || !max) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { part, x: event.clientX, width: rail.current.getBoundingClientRect().width, range, pointerId: event.pointerId }
    setDragging(part)
  }
  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId || !active.width) return
    const delta = (event.clientX - active.x) / active.width * max
    emit(active.part === "selection"
      ? moveAudioRange(active.range, delta, max)
      : resizeAudioRange(active.range, active.part, active.range[active.part === "start" ? 0 : 1] + delta, max))
  }
  const finishDrag = () => { drag.current = null; setDragging(null) }
  const keyboard = (part: RangePart, event: React.KeyboardEvent<HTMLButtonElement>) => {
    const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 0
    if (!direction && !["Home", "End", "PageUp", "PageDown"].includes(event.key)) return
    event.preventDefault()
    let delta = direction * (event.shiftKey ? 10 : 0.1)
    if (event.key === "PageUp") delta = 10
    if (event.key === "PageDown") delta = -10
    const current = part === "end" ? end : start
    const target = event.key === "Home" ? 0 : event.key === "End" ? max : current + delta
    emit(part === "selection" ? moveAudioRange(range, target - start, max) : resizeAudioRange(range, part, target, max))
  }
  const interactions = (part: RangePart) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => beginDrag(part, event),
    onPointerMove: moveDrag,
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
    onLostPointerCapture: finishDrag,
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => keyboard(part, event),
  })

  return (
    <div className="space-y-5" role="group" aria-label={I18n.t("audio_trim.title")}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{I18n.t("audio_trim.selected")}</span>
        <button type="button" role="slider" aria-label={I18n.t("audio_trim.move_selection")}
          aria-valuemin={0} aria-valuemax={Math.max(0, max - length)} aria-valuenow={start}
          aria-valuetext={I18n.t("audio_trim.range_value", { start: formatAudioTime(start), end: formatAudioTime(end) })}
          aria-orientation="horizontal" aria-describedby={hintId} title={I18n.t("audio_trim.move_selection")}
          className="flex min-h-10 touch-none select-none items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-mono text-primary tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-grab active:cursor-grabbing"
          {...interactions("selection")}>
          <GripVertical className="h-4 w-4" aria-hidden="true" />
          {formatAudioTime(length)} <span className="text-muted-foreground">/ {formatAudioTime(max)}</span>
        </button>
      </div>

      <div className="px-3">
        <div ref={rail} className="relative h-16 rounded-lg border bg-muted/60" aria-describedby={hintId}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            {Array.from({ length: 41 }, (_, index) => (
              <span key={index} className="absolute bottom-0 w-px bg-foreground/15" style={{ left: `${index * 2.5}%`, height: index % 10 === 0 ? "100%" : index % 5 === 0 ? "45%" : "20%" }} />
            ))}
          </div>
          <button type="button" role="slider" aria-label={I18n.t("audio_trim.move_selection_timeline")}
            aria-valuemin={0} aria-valuemax={Math.max(0, max - length)} aria-valuenow={start}
            aria-valuetext={I18n.t("audio_trim.range_value", { start: formatAudioTime(start), end: formatAudioTime(end) })}
            aria-orientation="horizontal" aria-describedby={hintId}
            className="absolute inset-y-0 flex touch-none select-none items-center justify-center overflow-hidden rounded-md border-y-2 border-primary bg-primary/20 text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing"
            style={{ left: `${percent(start)}%`, width: `${percent(end - start)}%` }} {...interactions("selection")}>
            <GripVertical className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
          {(["start", "end"] as const).map((part) => (
            <button key={part} type="button" role="slider" aria-label={I18n.t(`audio_trim.${part}`)}
              aria-valuemin={part === "start" ? 0 : start + gap} aria-valuemax={part === "start" ? end - gap : max}
              aria-valuenow={part === "start" ? start : end} aria-valuetext={formatAudioTime(part === "start" ? start : end)}
              aria-orientation="horizontal" aria-describedby={hintId}
              className="absolute inset-y-0 z-10 flex w-8 -translate-x-1/2 touch-none select-none items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-ew-resize sm:w-7"
              style={{ left: `${percent(part === "start" ? start : end)}%`, zIndex: dragging === part ? 20 : 10 }} {...interactions(part)}>
              <span className="flex h-full w-3 items-center justify-center rounded bg-primary shadow-sm"><span className="h-5 w-0.5 rounded bg-primary-foreground/80" /></span>
            </button>
          ))}
        </div>
        <div className="relative mt-2 h-4 text-[10px] font-mono text-muted-foreground sm:text-xs" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <span key={fraction} className="absolute" style={{ left: `${fraction * 100}%`, transform: `translateX(${fraction === 0 ? 0 : fraction === 1 ? -100 : -50}%)` }}>{formatAudioTime(max * fraction, 0)}</span>
          ))}
        </div>
      </div>

      <p id={hintId} className="text-xs text-muted-foreground">{I18n.t("audio_trim.hint")}</p>
      <div className="grid grid-cols-2 gap-3">
        <TimeField label={I18n.t("audio_trim.start")} value={start} revision={revision} onChange={(time) => emit(resizeAudioRange(range, "start", time, max))} />
        <TimeField label={I18n.t("audio_trim.end")} value={end} revision={revision} onChange={(time) => emit(resizeAudioRange(range, "end", time, max))} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={I18n.t("audio_trim.quick_duration")}>
          {[15, 30, 60].filter((seconds) => seconds <= max).map((seconds) => (
            <Button key={seconds} type="button" size="sm" variant={Math.abs(length - seconds) < 0.001 ? "secondary" : "outline"}
              aria-pressed={Math.abs(length - seconds) < 0.001} onClick={() => emit(setAudioRangeDuration(range, seconds, max))}>
              {I18n.t("audio_trim.seconds", { count: seconds })}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {setIsPlaying && <Button type="button" size="icon" variant="outline" title={I18n.t(isPlaying ? "audio_trim.pause" : "audio_trim.play")}
            aria-label={I18n.t(isPlaying ? "audio_trim.pause" : "audio_trim.play")} onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>}
          <Button type="button" size="icon" variant="outline" disabled={start <= 0} title={I18n.t("audio_trim.move_back")}
            aria-label={I18n.t("audio_trim.move_back")} onClick={() => emit(moveAudioRange(range, -1, max))}><ArrowLeft className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="outline" disabled={end >= max} title={I18n.t("audio_trim.move_forward")}
            aria-label={I18n.t("audio_trim.move_forward")} onClick={() => emit(moveAudioRange(range, 1, max))}><ArrowRight className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="outline" title={I18n.t("audio_trim.reset")}
            aria-label={I18n.t("audio_trim.reset")} onClick={() => emit(normalizeAudioRange(resetValue || [0, max], max))}><RotateCcw className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}
