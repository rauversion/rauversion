import React, { useEffect, useRef, useState } from "react"
import { useLocaleStore } from "stores/locales"
import { type PressKitVideo, resolveVideoSource } from "./video-embed"

type InstagramWindow = Window & { instgrm?: { Embeds: { process: () => void } } }
let instagramScript: Promise<void> | undefined

function loadInstagram() {
  if ((window as InstagramWindow).instgrm) return Promise.resolve()
  if (!instagramScript) {
    instagramScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://www.instagram.com/embed.js"
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => { script.remove(); instagramScript = undefined; reject(new Error("Instagram unavailable")) }
      document.body.appendChild(script)
    })
  }
  return instagramScript
}

function InstagramEmbed({ url, title }: { url: string; title: string }) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const target = container.current
    // The provider replaces the blockquote, so keep its DOM outside React's children.
    const element = document.createElement("blockquote")
    element.className = "instagram-media"
    element.dataset.instgrmPermalink = url
    element.dataset.instgrmVersion = "14"
    element.style.cssText = "margin:0;width:100%;min-width:0;max-width:540px;"
    const link = document.createElement("a")
    link.href = url
    link.textContent = title || "Instagram"
    element.appendChild(link)
    target?.replaceChildren(element)
    let cancelled = false
    loadInstagram().then(() => {
      if (!cancelled) (window as InstagramWindow).instgrm?.Embeds.process()
    }).catch(() => { /* The original link remains available if Instagram is blocked. */ })
    return () => { cancelled = true; target?.replaceChildren() }
  }, [url, title])
  return <div ref={container} className="mx-auto w-full max-w-[540px] [&_iframe]:!min-w-0 [&_iframe]:!max-w-full" />
}

export default function VideoEmbed({ video }: { video: PressKitVideo }) {
  const { i18n } = useLocaleStore
  const source = resolveVideoSource(video.url)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [video.url])
  if (!source) return null
  const ratio = video.aspectRatio || "auto"
  const portrait = ratio === "portrait" || (ratio === "auto" && source.portrait)
  const frameClass = portrait ? "aspect-[9/16] max-w-sm mx-auto" : ratio === "square" ? "aspect-square" : "aspect-video min-h-[200px]"

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      {source.kind === "instagram" ? (
        <div className="bg-secondary/30 p-2 sm:p-4"><InstagramEmbed url={source.url} title={video.title} /></div>
      ) : source.kind === "iframe" ? (
        <div className={`relative w-full bg-black ${frameClass}`}>
          <iframe
            src={source.embedUrl}
            title={video.title || `${source.provider} video`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : source.kind === "file" && !failed ? (
        <video key={source.url} src={source.url} controls playsInline preload="metadata" onError={() => setFailed(true)}
          aria-label={video.title || i18n.t("press_kit.videos.title")}
          className={ratio === "auto" ? "max-h-[70vh] w-full bg-black object-contain" : `w-full bg-black object-contain ${frameClass}`} />
      ) : (
        <div className="flex min-h-40 items-center justify-center bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          {i18n.t("press_kit.videos.external_hint")}
        </div>
      )}
      <div className="space-y-2 p-4">
        {video.title && <h3 className="text-lg font-semibold">{video.title}</h3>}
        {video.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{video.description}</p>}
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex text-sm text-primary hover:underline">
          {i18n.t("press_kit.videos.open_source", { provider: source.provider })} ↗
        </a>
      </div>
    </article>
  )
}
