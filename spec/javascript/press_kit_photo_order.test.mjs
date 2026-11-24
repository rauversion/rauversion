import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { transformSync } from "esbuild"

const { code } = transformSync(readFileSync(new URL("../../app/javascript/components/press_kit/photo-order.ts", import.meta.url), "utf8"), { loader: "ts", format: "esm" })
const { orderPressPhotos } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`)

test("older press kits keep their existing order", () => {
  const photos = [{ id: 10 }, { id: 20 }]
  assert.deepEqual(orderPressPhotos(photos), photos)
  assert.deepEqual(orderPressPhotos(photos, null), photos)
})

test("stored numeric IDs and form string IDs refer to the same photos", () => {
  const photos = [{ id: 10 }, { id: 20 }, { id: 30 }]
  assert.deepEqual(orderPressPhotos(photos, ["30", "10", "20"]), [photos[2], photos[0], photos[1]])
  assert.deepEqual(photos.map((photo) => photo.id), [10, 20, 30])
})

test("photos missing from an old list stay visible without losing the saved order", () => {
  const photos = [{ id: 10 }, { id: 20 }, { id: 30 }, { id: 40 }]
  assert.deepEqual(orderPressPhotos(photos, [20, 10]).map((photo) => photo.id), [20, 10, 30, 40])
})

test("deleted, duplicate and unrelated IDs do not duplicate or hide existing photos", () => {
  const photos = [{ id: 10 }, { id: 20 }, { id: 30 }]
  assert.deepEqual(orderPressPhotos(photos, [90, 30, "30", 80, 10]).map((photo) => photo.id), [30, 10, 20])
})
