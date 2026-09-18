import assert from "node:assert/strict"
import { test } from "node:test"
import { build } from "esbuild"

const { outputFiles } = await build({
  entryPoints: [new URL("../../app/javascript/lib/release-editor-pages.ts", import.meta.url).pathname],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
})
const { normalizeReleasePages } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
)

const pages = [{
  id: "BwrUCwgToo9B3f4NdZOEW",
  name: "Nueva Página",
  blocks: [
    {
      id: "f0FQzbSQ5K8ckYPRl3859",
      type: "text",
      props: { content: '<p style="text-align: left;">pokpokpokpok</p>', alignment: "left", proseSize: "base" },
    },
    {
      id: "4dGcwG2EjCUtpbZUNMtUO",
      type: "card",
      props: { variant: "default", title: "Titulo de la Card", description: "Descripcion de la card..." },
    },
  ],
  style: { primaryColor: "#6366f1", template: "minimal", darkMode: true, fontFamily: "sans" },
  createdAt: 1789735423760,
  updatedAt: 1789735431161,
}]

test("loads serialized pages saved by the release editor", () => {
  const editorData = { pages: JSON.stringify(pages) }
  assert.deepEqual(normalizeReleasePages(editorData.pages), pages)
})

test("loads pages from releases that also retain legacy Puck data", () => {
  const editorData = {
    root: { props: { alignment: "text-left", textColor: "#000000", background: "#fffdfaff" } },
    content: [{ type: "Section", props: { id: "legacy-section", title: "Legacy title" } }],
    zones: {},
    pages: JSON.stringify(pages),
  }
  const original = structuredClone(editorData)

  assert.deepEqual(normalizeReleasePages(editorData.pages), pages)
  assert.deepEqual(editorData, original)
})

test("continues to accept pages that are already arrays", () => {
  assert.deepEqual(normalizeReleasePages(pages), pages)
})

test("returns no pages for missing, malformed or non-array data", () => {
  for (const value of [undefined, null, "", "[", "null", "{}", "42", {}, 42, [], "[]"]) {
    assert.deepEqual(normalizeReleasePages(value), [], String(value))
  }
})
