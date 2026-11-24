import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { transformSync } from "esbuild"

const { code } = transformSync(readFileSync(new URL("../../app/javascript/components/press_kit/video-embed.ts", import.meta.url), "utf8"), { loader: "ts", format: "esm" })
const { resolveVideoSource } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`)

test("YouTube watch, share, embed and live URLs resolve to the same player", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=M7lc1UVf-VE&si=tracking",
    "https://youtu.be/M7lc1UVf-VE",
    "https://m.youtube.com/watch?v=M7lc1UVf-VE",
    "https://www.youtube.com/embed/M7lc1UVf-VE",
    "https://www.youtube.com/live/M7lc1UVf-VE",
  ]) {
    assert.equal(resolveVideoSource(url).embedUrl, "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE")
  }
})

test("Shorts use a portrait player and shared timestamps are preserved", () => {
  const source = resolveVideoSource("https://youtube.com/shorts/M7lc1UVf-VE?t=1h2m3s")
  assert.equal(source.portrait, true)
  assert.equal(new URL(source.embedUrl).searchParams.get("start"), "3723")
  assert.equal(new URL(resolveVideoSource("https://youtu.be/M7lc1UVf-VE?t=90").embedUrl).searchParams.get("start"), "90")
})

test("Instagram posts and reels use canonical public URLs without tracking", () => {
  for (const type of ["p", "reel", "reels", "tv"]) {
    const source = resolveVideoSource(`https://www.instagram.com/${type}/ABC_123-xyz/?igsh=tracking`)
    assert.equal(source.kind, "instagram")
    assert.equal(source.url, `https://www.instagram.com/${type === "reels" ? "reel" : type}/ABC_123-xyz/`)
  }
  assert.equal(resolveVideoSource("https://www.instagram.com/artist/"), null)
  assert.equal(resolveVideoSource("https://www.instagram.com/stories/artist/123"), null)
})

test("Vimeo player and unlisted share links retain their privacy hash", () => {
  for (const url of ["https://vimeo.com/123456789/abcdef1234", "https://player.vimeo.com/video/123456789?h=abcdef1234"]) {
    assert.equal(resolveVideoSource(url).embedUrl, "https://player.vimeo.com/video/123456789?h=abcdef1234")
  }
})

test("Direct video URLs retain signed query strings", () => {
  const url = "https://cdn.example.com/live.MP4?signature=abc&expires=123"
  assert.equal(resolveVideoSource(url).kind, "file")
  assert.equal(resolveVideoSource(url).url, url)
  assert.equal(resolveVideoSource("https://cdn.example.com/live.webm").kind, "file")
})

test("Other sources stay external links and cannot become arbitrary iframes", () => {
  for (const url of ["https://example.com/video/123", "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE"]) {
    assert.equal(resolveVideoSource(url).kind, "link")
    assert.equal(resolveVideoSource(url).embedUrl, undefined)
  }
})

test("Unsafe schemes, credentials, malformed URLs and invalid provider IDs are rejected", () => {
  for (const url of ["", "not a url", "javascript:alert(1)", "data:text/html,test", "http://example.com/test.mp4", "https://user:password@example.com/video.mp4", "https://youtube.com/watch?v=invalid", "https://vimeo.com/not-a-video", "https://instagram.com/reel/"]) {
    assert.equal(resolveVideoSource(url), null, url)
  }
})
