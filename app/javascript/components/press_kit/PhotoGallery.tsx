import React, { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useLocaleStore } from "stores/locales"
import type { PressPhoto } from "./PhotoSlideshow"

interface PhotoGalleryProps {
  photos: PressPhoto[]
  onSelect: (index: number) => void
}

export default function PhotoGallery({ photos, onSelect }: PhotoGalleryProps) {
  const { i18n } = useLocaleStore
  const [viewport, carousel] = useEmblaCarousel({ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps" })
  const [pagination, setPagination] = useState({ current: 1, total: 1, previous: false, next: false })
  const label = (key: string, options = {}) => i18n.t(`press_kit.gallery.${key}`, options)

  useEffect(() => {
    if (!carousel) return
    const update = () => setPagination({
      current: carousel.selectedScrollSnap() + 1,
      total: carousel.scrollSnapList().length,
      previous: carousel.canScrollPrev(),
      next: carousel.canScrollNext(),
    })
    update()
    carousel.on("select", update)
    carousel.on("reInit", update)
    return () => {
      carousel.off("select", update)
      carousel.off("reInit", update)
    }
  }, [carousel, photos.length])

  const navigate = (direction: "previous" | "next") => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (direction === "previous") carousel?.scrollPrev(instant)
    else carousel?.scrollNext(instant)
  }

  return (
    <div className="min-w-0 space-y-5" role="region" aria-roledescription="carousel" aria-label={i18n.t("press_kit.navigation.photos")}
      onKeyDown={(event) => {
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault()
          carousel?.scrollTo(event.key === "Home" ? 0 : pagination.total - 1, window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          return
        }
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        event.preventDefault()
        navigate(event.key === "ArrowLeft" ? "previous" : "next")
      }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label("count", { count: photos.length })}</p>
        {pagination.total > 1 && (
          <div className="flex items-center gap-3" role="group" aria-label={label("navigation")}>
            <span className="text-xs tabular-nums text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
              {label("page", { current: pagination.current, total: pagination.total })}
            </span>
            {(["previous", "next"] as const).map((direction) => (
              <button key={direction} type="button" onClick={() => navigate(direction)} disabled={!pagination[direction]} aria-label={label(direction)}
                className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background transition hover:border-primary/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-30">
                {direction === "previous" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={viewport} className="overflow-hidden touch-pan-y">
        <div className="-ml-4 flex items-stretch">
          {photos.map((photo, index) => (
            <div key={photo.id} className="min-w-0 flex-[0_0_86%] pl-4 sm:flex-[0_0_46%] lg:flex-[0_0_33.333333%]" role="group"
              aria-roledescription="slide" aria-label={i18n.t("press_kit.slideshow.counter", { current: index + 1, total: photos.length })}>
              <button type="button" onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); onSelect(index) }}
                aria-label={i18n.t("press_kit.slideshow.show_photo", { number: index + 1 })}
                className="group flex h-full w-full min-w-0 cursor-zoom-in flex-col overflow-hidden rounded-xl border border-border bg-secondary/30 text-left transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="flex h-64 w-full items-center justify-center bg-muted/30 p-3 sm:h-80 sm:p-4">
                  <img src={photo.pdf_url || photo.url} alt={photo.description || photo.title || i18n.t("press_kit.slideshow.photo", { number: index + 1 })}
                    className="h-full w-full select-none object-contain" loading="lazy" decoding="async" draggable={false} />
                </span>
                <span className="flex w-full flex-1 items-center justify-between gap-3 border-t border-border bg-background/80 p-4">
                  <span className="min-w-0 space-y-1">
                    {photo.title && <span className="block truncate text-sm font-semibold">{photo.title}</span>}
                    {photo.description && <span className="line-clamp-2 text-sm text-muted-foreground">{photo.description}</span>}
                    {!photo.title && !photo.description && <span className="text-sm text-muted-foreground">{i18n.t("press_kit.slideshow.photo", { number: index + 1 })}</span>}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {pagination.total > 1 && (
        <div className="flex items-center gap-4">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={label("navigation")}
            aria-valuemin={1} aria-valuemax={pagination.total} aria-valuenow={pagination.current}>
            <div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${pagination.current / pagination.total * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{label("hint")}</p>
        </div>
      )}
    </div>
  )
}
