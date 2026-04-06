"use client"

import React from "react"
import type { ImageBlock as ImageBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { ImageUploader } from "@/components/ui/image-uploader"

interface ImageBlockProps {
  block: ImageBlockType
  isEditing?: boolean
  onUpdate?: (props: Partial<ImageBlockType["props"]>) => void
}

export function ImageBlock({ block, isEditing, onUpdate }: ImageBlockProps) {
  const { src, alt, fit, rounded, aspectRatio } = block.props

  const fitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  }[fit]

  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded]

  const aspectClass = {
    auto: "",
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }[aspectRatio || "auto"]

  // Show uploader in edit mode when no image
  if (isEditing && !src) {
    return (
      <ImageUploader
        value={src}
        onSuccess={(dataUrl) => onUpdate?.({ src: dataUrl })}
        onRemove={() => onUpdate?.({ src: "" })}
        aspectRatio={aspectRatio}
        className={roundedClass}
      />
    )
  }

  // Show image with edit overlay in edit mode
  if (isEditing && src) {
    return (
      <div className={cn("relative group", roundedClass, aspectClass || "aspect-video")}>
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full", fitClass, roundedClass)}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ImageUploader
            value=""
            onSuccess={(dataUrl) => onUpdate?.({ src: dataUrl })}
            className="w-full h-full absolute inset-0 opacity-0"
          />
          <span className="text-white text-sm font-medium pointer-events-none">
            Click para cambiar imagen
          </span>
        </div>
      </div>
    )
  }

  // Preview mode - just show the image
  if (!src) {
    return null
  }

  return (
    <div className={cn("relative overflow-hidden", roundedClass, aspectClass)}>
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full", fitClass, roundedClass)}
      />
    </div>
  )
}
