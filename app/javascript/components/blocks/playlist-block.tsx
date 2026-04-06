"use client"

import React from "react"
import type { PageStyle, PlaylistBlock as PlaylistBlockType } from "@/lib/blocks/types"
import PlaylistComponent from "@/components/playlist"
import { getEmbedUrl, detectPlatform } from "@/lib/embeds"
import { cn } from "@/lib/utils"
import { ListMusic } from "lucide-react"

interface PlaylistBlockProps {
  block: PlaylistBlockType
  pageStyle?: PageStyle
  isEditing?: boolean
}

export function PlaylistBlock({ block, pageStyle, isEditing }: PlaylistBlockProps) {
  const { url, height, platform, theme } = block.props
  const playlistId = extractRauversionPlaylistId(url)
  const resolvedTheme = theme === "auto"
    ? pageStyle?.darkMode === false
      ? "light"
      : "dark"
    : theme

  if (platform === "rauversion" && playlistId) {
    return (
      <PlaylistComponent
        playlistId={playlistId}
        height={height}
        primaryColor={pageStyle?.primaryColor}
        template={pageStyle?.template}
        themeMode={resolvedTheme}
      />
    )
  }

  const detectedPlatform = detectPlatform(url) || platform
  const embedUrl = url
    ? getEmbedUrl(url, detectedPlatform, {
        theme: resolvedTheme === "auto" ? undefined : resolvedTheme,
        accentColor: pageStyle?.primaryColor,
      })
    : null

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/25 rounded-lg",
          isEditing ? "min-h-[200px]" : "min-h-[100px]"
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ListMusic className="h-8 w-8" />
          {isEditing && (
            <span className="text-sm">Añade una URL de playlist</span>
          )}
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

function extractRauversionPlaylistId(url: string): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed, window.location.origin)
    const match = parsed.pathname.match(/\/playlists\/([^/?#]+)/)
    if (match?.[1]) {
      return decodeURIComponent(match[1])
    }

    return parsed.pathname.replace(/^\/+|\/+$/g, "") || null
  } catch {
    return trimmed.replace(/^\/playlists\//, "").replace(/^\/+|\/+$/g, "") || null
  }
}
