"use client"

import React from "react"
import type { LinkEmbedBlock as LinkEmbedBlockType } from "@/lib/blocks/types"
import { parseYouTubeUrl, getYouTubeEmbedUrl } from "@/lib/embeds"
import { cn } from "@/lib/utils"
import { Link } from "lucide-react"

interface LinkEmbedBlockProps {
  block: LinkEmbedBlockType
  isEditing?: boolean
}

export function LinkEmbedBlock({ block, isEditing }: LinkEmbedBlockProps) {
  const { url, embedType, aspectRatio } = block.props

  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
  }[aspectRatio]

  let embedUrl: string | null = null

  if (embedType === "youtube" && url) {
    const info = parseYouTubeUrl(url)
    if (info) {
      embedUrl = getYouTubeEmbedUrl(info.id, info.type as "video" | "playlist")
    }
  }

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/25 rounded-lg",
          aspectClass
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Link className="h-8 w-8" />
          {isEditing && <span className="text-sm">Añade una URL de embed</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full rounded-lg overflow-hidden", aspectClass)}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="rounded-lg"
      />
    </div>
  )
}
