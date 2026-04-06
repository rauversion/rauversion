"use client"

import React from "react"
import type { TrackBlock as TrackBlockType } from "@/lib/blocks/types"
import { getEmbedUrl, detectPlatform } from "@/lib/embeds"
import { cn } from "@/lib/utils"
import { Music } from "lucide-react"

interface TrackBlockProps {
  block: TrackBlockType
  isEditing?: boolean
}

export function TrackBlock({ block, isEditing }: TrackBlockProps) {
  const { url, compact, platform } = block.props

  const detectedPlatform = detectPlatform(url) || platform
  const embedUrl = url ? getEmbedUrl(url, detectedPlatform) : null

  const height = compact ? 80 : 152

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/25 rounded-lg",
          compact ? "h-20" : "h-[152px]"
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Music className="h-6 w-6" />
          {isEditing && <span className="text-sm">Añade una URL de track</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
      />
    </div>
  )
}
