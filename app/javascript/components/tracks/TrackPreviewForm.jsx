import React, { useEffect } from "react"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import I18n from "stores/locales"
import AudioRangeSelector from "@/components/shared/AudioRangeSelector"
import { normalizeAudioRange, rangeLimit } from "@/lib/audio-range"

export default function TrackPreviewForm({ control, watch, setValue, hasVideo, originalDuration, durationStatus, onRetryDuration }) {
  const enabled = watch("preview_enabled")
  const start = Number(watch("preview_start_seconds"))
  const duration = Number(watch("preview_duration_seconds"))
  const total = rangeLimit(Number(originalDuration))

  const updateRange = (nextStart, nextEnd) => {
    setValue("preview_start_seconds", nextStart, { shouldDirty: true })
    setValue("preview_duration_seconds", Math.round((nextEnd - nextStart) * 1000) / 1000, { shouldDirty: true })
  }

  // Fit the default excerpt to short recordings, and synchronize when metadata
  // arrives after opening the editor. Never invent a source duration.
  useEffect(() => {
    if (!enabled || !total) return
    const [nextStart, nextEnd] = normalizeAudioRange([start, start + duration], total)
    const nextDuration = Math.round((nextEnd - nextStart) * 1000) / 1000
    if (nextStart !== start) setValue("preview_start_seconds", nextStart, { shouldDirty: true })
    if (nextDuration !== duration) setValue("preview_duration_seconds", nextDuration, { shouldDirty: true })
  }, [enabled, total, start, duration, setValue])

  return (
    <section className="space-y-4 rounded-lg border p-4" aria-labelledby="track-preview-heading">
      <div className="flex items-center justify-between gap-4">
        <Label id="track-preview-heading" htmlFor="track-preview-enabled">
          {I18n.t("tracks.preview.title")}
        </Label>
        <Controller
          name="preview_enabled"
          control={control}
          render={({ field }) => (
            <Switch id="track-preview-enabled" checked={field.value} onCheckedChange={field.onChange} disabled={hasVideo && !enabled} />
          )}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {I18n.t(hasVideo ? "tracks.preview.audio_only" : "tracks.preview.description")}
      </p>
      {enabled && (
        <div className="space-y-4">
          {total > 0 ? (
            <AudioRangeSelector
              value={[start, start + duration]}
              totalDuration={total}
              onValueChange={updateRange}
              resetValue={[0, Math.min(30, total)]}
            />
          ) : (
            <div className="space-y-3">
              <div role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
                {durationStatus === "loading" && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
                <p>{I18n.t(durationStatus === "error" ? "tracks.preview.duration_error" : "tracks.preview.duration_pending")}</p>
              </div>
              {durationStatus === "error" && onRetryDuration && (
                <Button type="button" variant="outline" size="sm" onClick={onRetryDuration}>
                  {I18n.t("tracks.preview.duration_retry")}
                </Button>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {["preview_start_seconds", "preview_duration_seconds"].map((name) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={name}>{I18n.t(`tracks.preview.${name}`)}</Label>
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id={name} type="number" min={name === "preview_start_seconds" ? 0 : 0.1}
                          step="0.1" max={originalDuration || undefined} required
                          value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? "" : Number(event.target.value))} />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{I18n.t("tracks.preview.processing_hint")}</p>
        </div>
      )}
    </section>
  )
}
