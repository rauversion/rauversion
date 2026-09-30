import assert from "node:assert/strict"
import { test } from "node:test"
import { build } from "esbuild"

const { outputFiles } = await build({
  entryPoints: [new URL("../../app/javascript/lib/track-preview-settings.ts", import.meta.url).pathname],
  bundle: true, platform: "node", format: "esm", write: false,
})
const { trackPreviewSettings } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
)

test("loading legacy JSON with null settings keeps usable form defaults", () => {
  assert.deepEqual(trackPreviewSettings({ preview_start_seconds: null, preview_duration_seconds: null }), {
    preview_enabled: false, preview_start_seconds: 0, preview_duration_seconds: 30,
  })
})

test("keeps saved settings, including zero start and explicitly disabled previews", () => {
  assert.deepEqual(trackPreviewSettings({
    preview_enabled: false, preview_start_seconds: 0, preview_duration_seconds: 15,
    metadata: { preview_enabled: true, preview_start_seconds: 20 },
  }), { preview_enabled: false, preview_start_seconds: 0, preview_duration_seconds: 15 })
})

test("hydrates saved preview settings from legacy metadata", () => {
  assert.deepEqual(trackPreviewSettings({
    preview_duration_seconds: null,
    metadata: { preview_enabled: true, preview_start_seconds: 60, preview_duration_seconds: 45 },
  }), { preview_enabled: true, preview_start_seconds: 60, preview_duration_seconds: 45 })
})
