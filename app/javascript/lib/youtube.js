export function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value.trim())
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) return null

    let videoId
    switch (url.hostname) {
      case "youtu.be":
      case "www.youtu.be":
        videoId = url.pathname.match(/^\/([\w-]{11})\/?$/)?.[1]
        break
      case "youtube.com":
      case "www.youtube.com":
      case "m.youtube.com":
      case "music.youtube.com":
        videoId = url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})\/?$/)?.[1]
        break
      case "youtube-nocookie.com":
      case "www.youtube-nocookie.com":
        videoId = url.pathname.match(/^\/embed\/([\w-]{11})\/?$/)?.[1]
        break
    }

    return /^[\w-]{11}$/.test(videoId || "")
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null
  } catch {
    return null
  }
}
