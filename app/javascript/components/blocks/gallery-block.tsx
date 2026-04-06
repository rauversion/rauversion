"use client"

import React from "react"
import type { GalleryBlock as GalleryBlockType, GalleryImage } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"
import { useState } from "react"

interface GalleryBlockProps {
  block: GalleryBlockType
  isEditing?: boolean
}

export function GalleryBlock({ block, isEditing }: GalleryBlockProps) {
  const { variant, images, columns, gap, rounded, showCaptions, lightbox } = block.props
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
  }

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }

  const openLightbox = (index: number) => {
    if (lightbox && !isEditing) {
      setCurrentIndex(index)
      setLightboxOpen(true)
    }
  }

  const closeLightbox = () => setLightboxOpen(false)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega imagenes a la galeria</p>
      </div>
    )
  }

  const renderImage = (image: GalleryImage, index: number, className?: string) => (
    <div
      key={image.id}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        roundedClasses[rounded],
        className
      )}
      onClick={() => openLightbox(index)}
    >
      <div className="relative aspect-square">
        {image.src ? (
          <img
            src={image.src}
            alt={image.alt || ""}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      {showCaptions && image.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-sm">{image.caption}</p>
        </div>
      )}
      {lightbox && !isEditing && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      )}
    </div>
  )

  switch (variant) {
    case "grid":
      return (
        <>
          <div className={cn("grid", columnClasses[columns], gapClasses[gap])}>
            {images.map((image, index) => renderImage(image, index))}
          </div>
          {renderLightbox()}
        </>
      )

    case "masonry":
      return (
        <>
          <div className={cn("columns-2 md:columns-3", gapClasses[gap], "space-y-4")}>
            {images.map((image, index) => (
              <div key={image.id} className="break-inside-avoid mb-4">
                {renderImage(image, index, "aspect-auto")}
              </div>
            ))}
          </div>
          {renderLightbox()}
        </>
      )

    case "slider":
      return (
        <>
          <div className="relative overflow-hidden">
            <div className={cn("flex overflow-x-auto snap-x snap-mandatory scrollbar-hide", gapClasses[gap])}>
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "flex-shrink-0 w-[80%] md:w-[60%] snap-center",
                    roundedClasses[rounded]
                  )}
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    {image.src ? (
                      <img
                        src={image.src}
                        alt={image.alt || ""}
                        className="h-full w-full object-cover cursor-pointer"
                        onClick={() => openLightbox(index)}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    {showCaptions && image.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-white text-sm">{image.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderLightbox()}
        </>
      )

    case "featured":
      const [first, ...rest] = images
      return (
        <>
          <div className={cn("grid md:grid-cols-2", gapClasses[gap])}>
            {first && (
              <div className={cn("md:row-span-2", roundedClasses[rounded], "overflow-hidden")}>
                <div className="relative aspect-square md:aspect-auto md:h-full cursor-pointer group" onClick={() => openLightbox(0)}>
                  {first.src ? (
                    <img
                      src={first.src}
                      alt={first.alt || ""}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  {showCaptions && first.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white">{first.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className={cn("grid grid-cols-2", gapClasses[gap])}>
              {rest.slice(0, 4).map((image, index) => renderImage(image, index + 1))}
            </div>
          </div>
          {renderLightbox()}
        </>
      )

    default:
      return null
  }

  function renderLightbox() {
    if (!lightboxOpen || !lightbox) return null

    return (
      <div 
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={closeLightbox}
      >
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
          className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>

        <div className="relative max-w-5xl max-h-[80vh] w-full h-full mx-16" onClick={(e) => e.stopPropagation()}>
          {images[currentIndex]?.src && (
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].alt || ""}
              className="max-h-full max-w-full object-contain"
            />
          )}
          {showCaptions && images[currentIndex]?.caption && (
            <div className="absolute bottom-0 inset-x-0 text-center p-4 text-white">
              {images[currentIndex].caption}
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
        >
          <ChevronRight className="h-10 w-10" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    )
  }
}
