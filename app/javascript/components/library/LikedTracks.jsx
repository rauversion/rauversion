import React, { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { get } from "@rails/request.js"
import {
  Clock3,
  Grid2x2,
  Heart,
  LayoutGrid,
  List,
  Loader2,
  Pause,
  Play,
  Shuffle,
} from "lucide-react"

import useAuthStore from "@/stores/authStore"
import useAudioStore from "@/stores/audioStore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getUserDisplayName } from "@/utils/userDisplayName"

const VIEW_MODES = [
  { id: "list", label: "Lista", icon: List },
  { id: "grid", label: "Grilla", icon: Grid2x2 },
  { id: "compact-grid", label: "Mosaico", icon: LayoutGrid },
]

function formatDuration(seconds) {
  if (!seconds) return "--:--"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function formatLikedDate(value) {
  if (!value) return "--"

  return new Date(value).toLocaleDateString()
}

function trackArtistsLabel(track) {
  if (track.artists?.length) {
    return track.artists
      .map((artist) => getUserDisplayName(artist))
      .join(", ")
  }

  return getUserDisplayName(track.user)
}

function getViewModeLabel(viewMode) {
  return VIEW_MODES.find((mode) => mode.id === viewMode)?.label || "Lista"
}

function LikedTrackViewToggle({ viewMode, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {VIEW_MODES.map((mode) => {
        const Icon = mode.icon
        const active = viewMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            aria-label={mode.label}
            title={mode.label}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-white text-black"
                : "text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}

function LikedTrackGridCard({ track, isCurrent, isPlaying, compact, onPlay }) {
  return (
    <article
      className={cn(
        "group rounded-[24px] border border-white/10 bg-white/5 transition-colors hover:bg-white/[0.08]",
        compact ? "p-2" : "p-3"
      )}
    >
      <div className="relative overflow-hidden rounded-[18px] bg-white/5">
        <img
          src={track.cover_url?.large || track.cover_url?.medium || track.cover_url?.small}
          alt={track.title}
          className={cn(
            "aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]",
            compact ? "rounded-[16px]" : "rounded-[18px]"
          )}
        />

        <button
          type="button"
          onClick={() => onPlay(track.id)}
          className={cn(
            "absolute bottom-3 right-3 inline-flex items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg transition-all hover:scale-[1.03] hover:bg-emerald-400",
            compact ? "h-10 w-10" : "h-11 w-11"
          )}
        >
          {isCurrent && isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>
      </div>

      <div className={cn("min-w-0", compact ? "mt-2 space-y-1" : "mt-3 space-y-1.5")}>
        <Link
          to={track.url}
          className={cn(
            "block font-medium transition-colors hover:text-white",
            compact ? "line-clamp-2 text-sm" : "truncate text-base",
            isCurrent ? "text-emerald-400" : "text-foreground"
          )}
        >
          {track.title}
        </Link>

        <p className={cn("text-muted-foreground", compact ? "line-clamp-2 text-xs" : "truncate text-sm")}>
          {trackArtistsLabel(track)}
        </p>

        <div className={cn("text-muted-foreground", compact ? "space-y-1 text-[11px]" : "space-y-1 text-xs")}>
          <p className="truncate">{track.album_title || "Single"}</p>
          {!compact && (
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">{formatLikedDate(track.liked_at)}</span>
              <span>{formatDuration(track.duration)}</span>
            </div>
          )}
          {compact && <p>{formatDuration(track.duration)}</p>}
        </div>
      </div>
    </article>
  )
}

export default function LikedTracks() {
  const { toast } = useToast()
  const { currentUser } = useAuthStore()
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list"

    const persistedViewMode = window.localStorage.getItem("liked-tracks-view-mode")
    return VIEW_MODES.some((mode) => mode.id === persistedViewMode) ? persistedViewMode : "list"
  })
  const loadMoreRef = useRef(null)

  const syncLikedQueue = useCallback((trackIds) => {
    if (!trackIds.length) return

    useAudioStore.setState({ playlist: trackIds })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    window.localStorage.setItem("liked-tracks-view-mode", viewMode)
  }, [viewMode])

  useEffect(() => {
    let cancelled = false
    const initialPage = page === 1

    const fetchLikedTracks = async () => {
      if (initialPage) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      try {
        const response = await get(`/api/v1/me/liked_tracks?page=${page}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          throw new Error("No se pudieron cargar tus me gusta.")
        }

        const nextData = await response.json
        if (!cancelled) {
          setData((previousData) => {
            if (initialPage || !previousData) {
              return nextData
            }

            const previousIds = new Set(previousData.collection.map((track) => track.id))
            const appendedTracks = nextData.collection.filter((track) => !previousIds.has(track.id))

            return {
              ...nextData,
              collection: [...previousData.collection, ...appendedTracks],
            }
          })

        }
      } catch (fetchError) {
        if (!cancelled) {
          if (initialPage) {
            setError(fetchError.message)
          } else {
            setPage((currentPage) => Math.max(1, currentPage - 1))
          }

          toast({
            title: "Error",
            description: initialPage ? fetchError.message : "No se pudieron cargar más tracks.",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          if (initialPage) {
            setLoading(false)
          } else {
            setLoadingMore(false)
          }
        }
      }
    }

    fetchLikedTracks()

    return () => {
      cancelled = true
    }
  }, [page, toast])

  const metadata = data?.metadata || {}

  useEffect(() => {
    const sentinel = loadMoreRef.current
    const hasMore = Boolean(metadata.next_page)

    if (!sentinel || loading || loadingMore || error || !hasMore) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return

        setPage((currentPage) => {
          const nextPage = metadata.next_page
          if (!nextPage || currentPage >= nextPage) return currentPage

          return nextPage
        })
      },
      {
        root: null,
        rootMargin: "0px 0px 320px 0px",
        threshold: 0.1,
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [error, loading, loadingMore, metadata.next_page])

  const tracks = data?.collection || []
  const queueTrackIds = data?.liked_playlist?.track_ids?.map((trackId) => `${trackId}`) || tracks.map((track) => `${track.id}`)
  const isLikedPlaylistActive = queueTrackIds.includes(`${currentTrackId}`)

  const playAll = () => {
    if (!tracks.length) return

    if (isPlaying && isLikedPlaylistActive) {
      pause()
      return
    }

    syncLikedQueue(queueTrackIds)
    play(queueTrackIds[0] || tracks[0].id)
  }

  const playShuffle = () => {
    if (!queueTrackIds.length) return

    const shuffledTrackIds = [...queueTrackIds].sort(() => Math.random() - 0.5)
    syncLikedQueue(shuffledTrackIds)
    play(shuffledTrackIds[0])
  }

  const handleTrackPlay = (trackId) => {
    const active = `${currentTrackId}` === `${trackId}`

    syncLikedQueue(queueTrackIds)

    if (active && isPlaying) {
      pause()
      return
    }

    pause()
    play(trackId)
  }

  return (
    <div className="min-h-screen overflow-hidden rounded-[32px] bg-background text-foreground">
      <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(123,82,255,0.95)_0%,rgba(47,18,89,0.92)_100%)] px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end">
          <div className="flex h-40 w-40 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-500 via-indigo-400 to-emerald-200 shadow-[0_20px_80px_rgba(30,20,90,0.4)]">
            <Heart className="h-16 w-16 fill-current text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/70">
              Playlist
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-7xl">
              Tus me gusta
            </h1>
            <p className="mt-4 text-sm text-white/75 md:text-base">
              {getUserDisplayName(currentUser)} · {data?.liked_playlist?.tracks_count || 0} canciones
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 md:px-10">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="icon"
              onClick={playAll}
              disabled={!tracks.length}
              className="h-14 w-14 rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {isPlaying && isLikedPlaylistActive ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="ml-0.5 h-6 w-6" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={playShuffle}
              disabled={!tracks.length}
              className="h-11 w-11 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Shuffle className="h-5 w-5" />
            </Button>
          </div>

          <LikedTrackViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>

        {loading && (
          <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando tus me gusta...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && !tracks.length && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-muted-foreground">
            Aún no tienes tracks marcados con me gusta.
          </div>
        )}

        {!loading && !error && tracks.length > 0 && (
          <>
            {viewMode === "list" ? (
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-12 px-4 text-center">#</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead className="hidden md:table-cell">Álbum</TableHead>
                      <TableHead className="hidden lg:table-cell">Agregado</TableHead>
                      <TableHead className="w-20 text-right">
                        <Clock3 className="ml-auto h-4 w-4" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {tracks.map((track, index) => {
                      const isCurrent = `${currentTrackId}` === `${track.id}`

                      return (
                        <TableRow
                          key={track.id}
                          className={cn(
                            "group border-white/5 hover:bg-white/5",
                            isCurrent && "bg-emerald-500/10"
                          )}
                        >
                          <TableCell className="px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTrackPlay(track.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                            >
                              {isCurrent && isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <>
                                  <span className="group-hover:hidden">{index + 1}</span>
                                  <Play className="hidden h-4 w-4 group-hover:block" />
                                </>
                              )}
                            </button>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={track.cover_url?.small || track.cover_url?.medium}
                                alt={track.title}
                                className="h-11 w-11 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <Link
                                  to={track.url}
                                  className={cn(
                                    "block truncate font-medium transition-colors hover:text-white",
                                    isCurrent ? "text-emerald-400" : "text-foreground"
                                  )}
                                >
                                  {track.title}
                                </Link>
                                <p className="truncate text-sm text-muted-foreground">
                                  {trackArtistsLabel(track)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {track.album_title || "Single"}
                          </TableCell>

                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {formatLikedDate(track.liked_at)}
                          </TableCell>

                          <TableCell className="text-right text-muted-foreground">
                            {formatDuration(track.duration)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div
                className={cn(
                  "grid",
                  viewMode === "grid"
                    ? "grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
                )}
              >
                {tracks.map((track) => {
                  const isCurrent = `${currentTrackId}` === `${track.id}`

                  return (
                    <LikedTrackGridCard
                      key={track.id}
                      track={track}
                      isCurrent={isCurrent}
                      isPlaying={isCurrent && isPlaying}
                      compact={viewMode === "compact-grid"}
                      onPlay={handleTrackPlay}
                    />
                  )
                })}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {metadata.total_count || 0} tracks guardados
              </p>
              <p className="text-sm text-muted-foreground">
                {metadata.total_pages > 1
                  ? `Página ${metadata.current_page || 1} de ${metadata.total_pages}`
                  : getViewModeLabel(viewMode)}
              </p>
            </div>

            {loadingMore && (
              <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando más tracks...
              </div>
            )}

            {metadata.next_page && (
              <div ref={loadMoreRef} aria-hidden="true" className="h-4" />
            )}
          </>
        )}
      </div>
    </div>
  )
}
