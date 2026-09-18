import React from "react"
import { youtubeEmbedUrl } from "@/lib/youtube"

export default function YouTubePlayer({ url, title }) {
  const embedUrl = youtubeEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <iframe
      key={embedUrl}
      src={embedUrl}
      title={title || "YouTube"}
      className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  )
}
