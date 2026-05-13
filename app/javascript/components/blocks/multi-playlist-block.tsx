"use client"

import React, { useEffect, useMemo, useState } from "react"
import { ListMusic } from "lucide-react"

import type { MultiPlaylistBlock as MultiPlaylistBlockType, PageStyle } from "@/lib/blocks/types"
import PlaylistComponent from "@/components/playlist"
import { cn } from "@/lib/utils"
import { getUserDisplayName } from "@/utils/userDisplayName"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  buildPlaylistPalette,
  resolvePlaylistCoverUrl,
  resolvePlaylistTheme,
} from "@/lib/playlist-theme"
import { get } from "@rails/request.js"

interface PlaylistUser {
  username?: string
  display_name?: string
  full_name?: string
  first_name?: string
  last_name?: string
  name?: string
}

interface PlaylistRecord {
  id?: number | string
  title?: string
  description?: string
  cover_url?: string | { small?: string; medium?: string; large?: string; cropped_image?: string }
  tracks_count?: number
  tracks?: unknown[]
  playlist_type?: string
  url?: string
  user?: PlaylistUser
}

interface MultiPlaylistBlockProps {
  block: MultiPlaylistBlockType
  pageStyle?: PageStyle
  isEditing?: boolean
}

const horizontalItemSizeVariants = {
  responsive: "md:basis-1/2 xl:basis-1/3",
  third: "md:basis-1/3",
  half: "md:basis-1/2",
} as const

function resolveTrackCount(playlist?: PlaylistRecord | null) {
  if (typeof playlist?.tracks_count === "number") return playlist.tracks_count
  if (Array.isArray(playlist?.tracks)) return playlist.tracks.length

  return 0
}

export function MultiPlaylistBlock({
  block,
  pageStyle,
  isEditing = false,
}: MultiPlaylistBlockProps) {
  const { playlistIds, autoPlay, interval, itemSize, orientation } = block.props
  const resolvedPlaylistIds = useMemo(
    () => (Array.isArray(playlistIds) ? playlistIds.map((playlistId) => String(playlistId)).filter(Boolean) : []),
    [playlistIds]
  )

  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [api, setApi] = useState<CarouselApi>()
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const themeMode = resolvePlaylistTheme(pageStyle)
  const palette = buildPlaylistPalette({
    primaryColor: pageStyle?.primaryColor,
    template: pageStyle?.template,
    themeMode,
  })

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (resolvedPlaylistIds.length === 0) {
        setPlaylists([])
        setSelectedPlaylistId(null)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const requestUrl = new URL("/playlists/albums.json", window.location.origin)
        requestUrl.searchParams.set("ids", resolvedPlaylistIds.join(","))

        const response = await get(`${requestUrl.pathname}${requestUrl.search}`, { responseKind: "json" })

        if (!response.ok) {
          throw new Error("No pudimos cargar las playlists")
        }

        const data = await response.json
        const collection = Array.isArray(data?.collection) ? data.collection : []
        const playlistsById = new Map(
          collection
            .filter((playlist: PlaylistRecord | null | undefined) => playlist?.id)
            .map((playlist: PlaylistRecord) => [String(playlist.id), playlist])
        )
        const orderedPlaylists = resolvedPlaylistIds
          .map((playlistId) => playlistsById.get(playlistId))
          .filter(Boolean) as PlaylistRecord[]

        setPlaylists(orderedPlaylists)
        setSelectedPlaylistId((currentValue) => {
          if (currentValue && orderedPlaylists.some((playlist) => String(playlist.id) === currentValue)) {
            return currentValue
          }

          const firstPlaylist = orderedPlaylists[0]
          return firstPlaylist?.id ? String(firstPlaylist.id) : null
        })
      } catch (nextError) {
        setPlaylists([])
        setSelectedPlaylistId(null)
        setError(nextError instanceof Error ? nextError.message : "No pudimos cargar las playlists")
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [resolvedPlaylistIds])

  useEffect(() => {
    if (!api || !autoPlay || playlists.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      api.scrollNext()
    }, interval)

    return () => window.clearInterval(timer)
  }, [api, autoPlay, interval, playlists.length])

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl border bg-muted/40" />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (playlists.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20",
          isEditing ? "min-h-[240px]" : "min-h-[140px]"
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
          <ListMusic className="h-8 w-8" />
          <span className="text-sm">
            {isEditing ? "Selecciona playlists para este bloque" : "No hay playlists para mostrar"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Carousel
        orientation={orientation}
        setApi={setApi}
        className={cn("w-full", orientation === "vertical" && "mx-auto max-h-[32rem] max-w-xl")}
        opts={{
          align: "start",
          loop: playlists.length > 1,
        }}
      >
        <CarouselContent>
          {playlists.map((playlist) => {
            const playlistId = playlist.id ? String(playlist.id) : ""
            const isSelected = selectedPlaylistId === playlistId
            const coverUrl = resolvePlaylistCoverUrl(playlist.cover_url)
            const trackCount = resolveTrackCount(playlist)
            const artistName = getUserDisplayName(playlist.user) || playlist.user?.username || null

            return (
              <CarouselItem
                key={playlistId}
                className={cn(
                  orientation === "horizontal"
                    ? horizontalItemSizeVariants[itemSize]
                    : "basis-[18rem]"
                )}
              >
                <button
                  type="button"
                  className="group block h-full w-full overflow-hidden rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: palette.panel,
                    borderColor: isSelected ? palette.accent : palette.border,
                    boxShadow: isSelected ? `0 0 0 1px ${palette.accentSoft}` : undefined,
                  }}
                  onClick={() => setSelectedPlaylistId(playlistId)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={playlist.title || ""}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: palette.surface, color: palette.muted }}
                      >
                        <ListMusic className="h-10 w-10" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="line-clamp-2 text-base font-semibold text-white">{playlist.title}</h3>
                      <p className="mt-1 text-sm text-white/80">
                        {[artistName, trackCount > 0 ? `${trackCount} tracks` : null].filter(Boolean).join(" · ") || "Playlist"}
                      </p>
                    </div>
                  </div>

                  {playlist.description ? (
                    <div
                      className="border-t px-4 py-3 text-sm"
                      style={{ borderColor: palette.border, color: palette.muted }}
                    >
                      <p className="line-clamp-2">{playlist.description}</p>
                    </div>
                  ) : null}
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {playlists.length > 1 ? (
          <>
            <CarouselPrevious
              className="border"
              style={{ background: palette.panel, borderColor: palette.border, color: palette.text }}
            />
            <CarouselNext
              className="border"
              style={{ background: palette.panel, borderColor: palette.border, color: palette.text }}
            />
          </>
        ) : null}
      </Carousel>

      {selectedPlaylistId ? (
        <PlaylistComponent
          playlistId={selectedPlaylistId}
          primaryColor={pageStyle?.primaryColor}
          template={pageStyle?.template}
          themeMode={themeMode}
        />
      ) : null}
    </div>
  )
}
