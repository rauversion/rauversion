import React from "react"
import { Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import I18n from "stores/locales"

export default function PlaylistPreviewBadge({ playlist, className }) {
  const hasPreview = playlist.tracks?.some((track) =>
    (track.preview_enabled ?? track.metadata?.preview_enabled) === true
  )
  if (!hasPreview) return null

  const description = I18n.t("tracks.preview.playlist_indicator_description")
  return (
    <span title={description} aria-label={description}
      className={cn("inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap", className)}>
      <Scissors className="h-3 w-3" aria-hidden="true" />
      {I18n.t("tracks.preview.indicator")}
    </span>
  )
}
