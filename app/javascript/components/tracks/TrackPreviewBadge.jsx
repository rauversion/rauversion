import React from "react"
import { Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatAudioTime } from "@/lib/audio-range"
import I18n from "stores/locales"

export default function TrackPreviewBadge({ track, compact = false, className }) {
  const enabled = track?.preview_enabled ?? track?.metadata?.preview_enabled
  if (enabled !== true) return null

  const duration = Number(track.preview_duration_seconds ?? track.metadata?.preview_duration_seconds ?? track.duration)
  const hasDuration = Number.isFinite(duration) && duration > 0
  const time = hasDuration ? formatAudioTime(duration, Number.isInteger(duration) ? 0 : 1) : null
  const description = I18n.t(hasDuration ? "tracks.preview.indicator_description_duration" : "tracks.preview.indicator_description", { duration: time })

  return (
    <span title={description} aria-label={description}
      className={cn("inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap", className)}>
      {!compact && <Scissors className="h-3 w-3" aria-hidden="true" />}
      {I18n.t("tracks.preview.indicator")}
      {!compact && time && <span className="font-mono tabular-nums">· {time}</span>}
    </span>
  )
}
