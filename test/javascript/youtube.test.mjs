import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { youtubeEmbedUrl } from "../../app/javascript/lib/youtube.js"

const fixtures = JSON.parse(readFileSync(new URL("../../spec/fixtures/youtube_urls.json", import.meta.url)))

test("converts supported YouTube links to a fixed embed origin", () => {
  for (const url of fixtures.valid) {
    assert.equal(youtubeEmbedUrl(url), `https://www.youtube-nocookie.com/embed/${fixtures.video_id}`, url)
  }
})

test("rejects non-video links, unsafe hosts and invalid IDs", () => {
  for (const url of [...fixtures.invalid, "", " ", null, undefined]) {
    assert.equal(youtubeEmbedUrl(url), null, String(url))
  }
})
