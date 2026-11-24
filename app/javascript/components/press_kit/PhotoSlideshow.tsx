import React, { useEffect, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useLocaleStore } from "stores/locales"

export interface PressPhoto {
  id: number | string
  url: string
  pdf_url?: string
  title?: string
  description?: string
}

interface PhotoSlideshowProps {
  photos: PressPhoto[]
  initialIndex: number
  onClose: () => void
  style?: React.CSSProperties
}

export default function PhotoSlideshow({ photos, initialIndex, onClose, style }: PhotoSlideshowProps) {
  const { i18n } = useLocaleStore
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const returnFocus = useRef(document.activeElement as HTMLElement | null)
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([])
  const [viewport, carousel] = useEmblaCarousel({ loop: photos.length > 1, startIndex: initialIndex })
  const photo = photos[selectedIndex]
  const multiple = photos.length > 1
  const label = (key: string, options = {}) => i18n.t(`press_kit.slideshow.${key}`, options)

  useEffect(() => {
    if (!carousel) return
    const onSelect = () => setSelectedIndex(carousel.selectedScrollSnap())
    carousel.on("select", onSelect)
    carousel.on("reInit", onSelect)
    return () => {
      carousel.off("select", onSelect)
      carousel.off("reInit", onSelect)
    }
  }, [carousel])

  useEffect(() => {
    thumbnails.current[selectedIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [selectedIndex, carousel])

  if (!photo) return null

  const navigate = (direction: "previous" | "next") => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (direction === "previous") carousel?.scrollPrev(instant)
    else carousel?.scrollNext(instant)
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay style={style} className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl" />
        <Dialog.Content
          style={style}
          className="fixed inset-x-2 top-1/2 z-[101] mx-auto flex max-h-[94dvh] max-w-6xl -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl outline-none sm:inset-x-8 sm:rounded-3xl"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus({ preventScroll: true }) }}
          onKeyDown={(event) => {
            if (!multiple || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return
            event.preventDefault()
            navigate(event.key === "ArrowLeft" ? "previous" : "next")
          }}
        >
          <Dialog.Title className="sr-only">{label("title")}</Dialog.Title>
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label("title")}</p>
            <div className="flex items-center gap-4">
              <span className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
                {label("counter", { current: selectedIndex + 1, total: photos.length })}
              </span>
              <Dialog.Close className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background/80 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={label("close")}>
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
          </div>

          <div className="relative min-h-0 shrink bg-muted/30">
            <img src={photo.url || photo.pdf_url} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 blur-3xl" />
            <div ref={viewport} className="relative overflow-hidden touch-pan-y">
              <div className="flex">
                {photos.map((item, index) => (
                  <div key={item.id} className="relative flex h-[48dvh] max-h-[calc(94dvh-220px)] min-w-0 flex-[0_0_100%] items-center justify-center px-3 py-4 sm:h-[58dvh] sm:px-16" aria-hidden={index !== selectedIndex}>
                    <img src={item.url || item.pdf_url} alt={item.description || item.title || label("photo", { number: index + 1 })}
                      className="block max-h-full max-w-full select-none object-contain shadow-2xl" draggable={false}
                      loading={index === initialIndex ? "eager" : "lazy"} decoding="async" />
                  </div>
                ))}
              </div>
            </div>
            {multiple && (["previous", "next"] as const).map((direction) => (
              <button key={direction} type="button" onClick={() => navigate(direction)} aria-label={label(direction)}
                className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/85 shadow-lg backdrop-blur transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${direction === "previous" ? "left-2 sm:left-4" : "right-2 sm:right-4"}`}>
                {direction === "previous" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
              </button>
            ))}
          </div>

          <div className="shrink-0 space-y-3 border-t border-border bg-card px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                {photo.title && <h3 className="truncate font-semibold">{photo.title}</h3>}
                {photo.description && <p className="max-h-12 overflow-y-auto text-sm text-muted-foreground">{photo.description}</p>}
                {multiple && <p className="text-xs text-muted-foreground">{label("hint")}</p>}
              </div>
              <a href={photo.url || photo.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:text-sm">
                {label("original")} <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            {multiple && (
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={label("thumbnails")}>
                {photos.map((item, index) => (
                  <button key={item.id} type="button" ref={(element) => { thumbnails.current[index] = element }}
                    onClick={() => carousel?.scrollTo(index, window.matchMedia("(prefers-reduced-motion: reduce)").matches)}
                    aria-label={label("show_photo", { number: index + 1 })} aria-current={index === selectedIndex ? "true" : undefined}
                    className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === selectedIndex ? "border-primary opacity-100" : "border-transparent opacity-50 hover:opacity-100"}`}>
                    <img src={item.pdf_url || item.url} alt="" className="h-full w-full object-contain" loading="lazy" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
