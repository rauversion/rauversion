export interface PressKitVideo {
  title: string
  url: string
  description?: string
  aspectRatio?: "auto" | "landscape" | "portrait" | "square"
}

export interface VideoSource {
  provider: string
  kind: "iframe" | "instagram" | "file" | "link"
  url: string
  embedUrl?: string
  portrait?: boolean
}

// Only known providers become embeds. Other HTTPS URLs remain ordinary links.
export function resolveVideoSource(value: string): VideoSource | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:" || url.username || url.password) return null
    const host = url.hostname.toLowerCase().replace(/^www\./, "")
    const parts = url.pathname.split("/").filter(Boolean)

    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
      const id = host === "youtu.be" ? parts[0] : parts[0] === "watch" ? url.searchParams.get("v") :
        ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null
      if (!id || !/^[\w-]{11}$/.test(id)) return null
      const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
      const time = url.searchParams.get("t") || url.searchParams.get("start")
      if (time && /^(?:\d+h)?(?:\d+m)?(?:\d+s?)?$/.test(time)) {
        const units = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/)
        if (units) embed.searchParams.set("start", String(Number(units[1] || 0) * 3600 + Number(units[2] || 0) * 60 + Number(units[3] || 0)))
      }
      return { provider: "YouTube", kind: "iframe", url: url.href, embedUrl: embed.href, portrait: parts[0] === "shorts" }
    }

    if (["instagram.com", "m.instagram.com"].includes(host)) {
      if (!["p", "reel", "reels", "tv"].includes(parts[0]) || !/^[\w-]+$/.test(parts[1] || "")) return null
      return { provider: "Instagram", kind: "instagram", url: `https://www.instagram.com/${parts[0] === "reels" ? "reel" : parts[0]}/${parts[1]}/` }
    }

    if (["vimeo.com", "player.vimeo.com"].includes(host)) {
      const id = host === "player.vimeo.com" && parts[0] === "video" ? parts[1] : parts[0]
      if (!/^\d+$/.test(id || "")) return null
      const embed = new URL(`https://player.vimeo.com/video/${id}`)
      const hash = url.searchParams.get("h") || (host === "vimeo.com" ? parts[1] : null)
      if (hash && /^[\da-z]+$/i.test(hash)) embed.searchParams.set("h", hash)
      return { provider: "Vimeo", kind: "iframe", url: url.href, embedUrl: embed.href }
    }

    if (/\.(mp4|webm|ogv|ogg)$/i.test(url.pathname)) {
      return { provider: "Video", kind: "file", url: url.href }
    }
    return { provider: host, kind: "link", url: url.href }
  } catch {
    return null
  }
}
