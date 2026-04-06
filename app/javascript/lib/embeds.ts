import type { Platform } from "./blocks/types"

interface EmbedInfo {
  platform: Platform
  id: string
  type: "track" | "playlist" | "album" | "video"
}

interface EmbedOptions {
  theme?: "dark" | "light"
  accentColor?: string
}

export function parseSpotifyUrl(url: string): EmbedInfo | null {
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const type = url.includes("/track/")
        ? "track"
        : url.includes("/playlist/")
          ? "playlist"
          : "album"
      return { platform: "spotify", id: match[1], type }
    }
  }
  return null
}

export function parseYouTubeUrl(url: string): EmbedInfo | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const type = url.includes("playlist") ? "playlist" : "video"
      return { platform: "youtube", id: match[1], type }
    }
  }
  return null
}

export function parseSoundCloudUrl(url: string): EmbedInfo | null {
  if (url.includes("soundcloud.com")) {
    // SoundCloud URLs are complex, we'll use oEmbed
    const isPlaylist = url.includes("/sets/")
    return {
      platform: "soundcloud",
      id: url,
      type: isPlaylist ? "playlist" : "track",
    }
  }
  return null
}

export function parseEmbedUrl(url: string): EmbedInfo | null {
  return parseSpotifyUrl(url) || parseYouTubeUrl(url) || parseSoundCloudUrl(url)
}

export function getSpotifyEmbedUrl(
  id: string,
  type: "track" | "playlist" | "album",
  theme: "dark" | "light" = "dark"
): string {
  const spotifyTheme = theme === "light" ? 1 : 0
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=${spotifyTheme}`
}

export function getYouTubeEmbedUrl(id: string, type: "video" | "playlist"): string {
  if (type === "playlist") {
    return `https://www.youtube.com/embed/videoseries?list=${id}`
  }
  return `https://www.youtube.com/embed/${id}`
}

export function getSoundCloudEmbedUrl(url: string, accentColor?: string): string {
  // SoundCloud requires oEmbed API call, return encoded URL for iframe
  const color = (accentColor || "#ff5500").replace("#", "%23")
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=${color}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
}

export function detectPlatform(url: string): Platform | null {
  if (url.includes("spotify.com")) return "spotify"
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("soundcloud.com")) return "soundcloud"
  return null
}

export function getEmbedUrl(url: string, platform: Platform, options: EmbedOptions = {}): string | null {
  const info = parseEmbedUrl(url)
  if (!info) return null

  switch (platform) {
    case "spotify":
      return getSpotifyEmbedUrl(info.id, info.type as "track" | "playlist" | "album", options.theme)
    case "youtube":
      return getYouTubeEmbedUrl(info.id, info.type as "video" | "playlist")
    case "soundcloud":
      return getSoundCloudEmbedUrl(url, options.accentColor)
    default:
      return null
  }
}
