import assert from "node:assert/strict"
import { test } from "node:test"
import { build } from "esbuild"

const { outputFiles } = await build({
  entryPoints: [new URL("../../app/javascript/lib/audio-range.ts", import.meta.url).pathname],
  bundle: true, platform: "node", format: "esm", write: false,
})
const { normalizeAudioRange, moveAudioRange, resizeAudioRange, setAudioRangeDuration, formatAudioTime, parseAudioTime, rangeLimit } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
)

test("moving the excerpt preserves its length at both boundaries", () => {
  assert.deepEqual(moveAudioRange([20, 50], -100, 180), [0, 30])
  assert.deepEqual(moveAudioRange([20, 50], 1000, 180), [150, 180])
  assert.deepEqual(moveAudioRange([20, 50], 0.1, 180), [20.1, 50.1])
})

test("handles cannot cross each other or extend outside the original", () => {
  assert.deepEqual(resizeAudioRange([20, 50], "start", 70, 180), [49.9, 50])
  assert.deepEqual(resizeAudioRange([20, 50], "end", 10, 180), [20, 20.1])
  assert.deepEqual(resizeAudioRange([20, 50], "start", -10, 180), [0, 50])
  assert.deepEqual(resizeAudioRange([20, 50], "end", 1000, 180), [20, 180])
})

test("quick durations move back when needed to fit the requested length", () => {
  assert.deepEqual(setAudioRangeDuration([170, 180], 30, 180), [150, 180])
  assert.deepEqual(setAudioRangeDuration([20, 50], 15, 180), [20, 35])
})

test("short recordings and fractional durations remain inside the real file", () => {
  assert.deepEqual(normalizeAudioRange([0, 30], 0.417938), [0, 0.417])
  assert.deepEqual(normalizeAudioRange([20, 50], 0.04), [0, 0.04])
  assert.deepEqual(normalizeAudioRange([45, 75], 6), [0, 6])
  assert.deepEqual(normalizeAudioRange([0, 30], 0), [0, 0])
  assert.equal(rangeLimit(Infinity), 0)
  const value = normalizeAudioRange([600, 630], 359.9999)
  assert.ok(value[0] >= 0 && value[1] <= 359.9999 && value[1] > value[0])
})

test("accepts seconds, minutes and hours with millisecond precision", () => {
  assert.equal(parseAudioTime("75.5"), 75.5)
  assert.equal(parseAudioTime("1:15.125"), 75.125)
  assert.equal(parseAudioTime("1:02:15.5"), 3735.5)
  for (const invalid of ["", "-1", "abc", "1:70", "1:", "1:2:3:4", "1.5:20", "Infinity"]) {
    assert.equal(parseAudioTime(invalid), null, invalid)
  }
})

test("formats minute boundaries and retains precision for exact input", () => {
  assert.equal(formatAudioTime(59.999), "1:00.0")
  assert.equal(formatAudioTime(75.125, 3), "1:15.125")
  assert.equal(formatAudioTime(3600), "60:00.0")
})
