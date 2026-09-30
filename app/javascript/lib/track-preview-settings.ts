// Legacy tracks can return null at the top level even though the form has
// defaults. Keep persisted metadata when present and fill only missing values.
export function trackPreviewSettings(track: Record<string, any>) {
  return {
    preview_enabled: track.preview_enabled ?? track.metadata?.preview_enabled ?? false,
    preview_start_seconds: track.preview_start_seconds ?? track.metadata?.preview_start_seconds ?? 0,
    preview_duration_seconds: track.preview_duration_seconds ?? track.metadata?.preview_duration_seconds ?? 30,
  }
}
