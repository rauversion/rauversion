import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { get } from "@rails/request.js"
import {
  Clock3,
  Heart,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function buildPageWindow(currentPage, totalPages) {
  if (!totalPages || totalPages <= 1) return [1]

  let start = Math.max(1, currentPage - 1)
  let end = Math.min(totalPages, start + 2)

  if (end - start < 2) {
    start = Math.max(1, end - 2)
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
}

function formatDuration(seconds) {
  if (!seconds) return "--:--"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function trackArtistsLabel(track) {
  if (track.artists?.length) {
    return track.artists
      .map((artist) => artist.full_name || artist.username)
      .join(", ")
  }

  return track.user?.full_name || track.user?.username || ""
}

export default function LikedTracks() {
  const { toast } = useToast()
  const { currentUser } = useAuthStore()
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchLikedTracks = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await get(`/api/v1/me/liked_tracks?page=${page}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          throw new Error("No se pudieron cargar tus me gusta.")
        }

        const nextData = await response.json
        if (!cancelled) {
          setData(nextData)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message)
          toast({
            title: "Error",
            description: fetchError.message,
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchLikedTracks()

    return () => {
      cancelled = true
    }
  }, [page, toast])

  const tracks = data?.collection || []
  const metadata = data?.metadata || {}
  const visiblePages = useMemo(
    () => buildPageWindow(metadata.current_page || 1, metadata.total_pages || 1),
    [metadata.current_page, metadata.total_pages]
  )

  const playAll = () => {
    if (!tracks.length) return

    const trackIds = tracks.map((track) => `${track.id}`)
    useAudioStore.setState({ playlist: trackIds })
    play(tracks[0].id)
  }

  const playShuffle = () => {
    if (!tracks.length) return

    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5)
    const trackIds = shuffledTracks.map((track) => `${track.id}`)
    useAudioStore.setState({ playlist: trackIds })
    play(shuffledTracks[0].id)
  }

  const handleTrackPlay = (trackId) => {
    const active = `${currentTrackId}` === `${trackId}`

    useAudioStore.setState({ playlist: tracks.map((track) => `${track.id}`) })

    if (active && isPlaying) {
      pause()
      return
    }

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
              {currentUser?.username} · {data?.liked_playlist?.tracks_count || 0} canciones
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
              {isPlaying && tracks.some((track) => `${track.id}` === `${currentTrackId}`) ? (
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

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
            <span>Lista</span>
            <List className="h-4 w-4" />
          </div>
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
                          "border-white/5 hover:bg-white/5",
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
                          {track.liked_at ? new Date(track.liked_at).toLocaleDateString() : "--"}
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

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {metadata.total_count || 0} tracks guardados
              </p>

              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        if (metadata.prev_page) {
                          setPage(metadata.prev_page)
                        }
                      }}
                      className={cn(!metadata.prev_page && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>

                  {visiblePages.map((visiblePage) => (
                    <PaginationItem key={visiblePage}>
                      <PaginationLink
                        href="#"
                        isActive={visiblePage === (metadata.current_page || 1)}
                        onClick={(event) => {
                          event.preventDefault()
                          setPage(visiblePage)
                        }}
                      >
                        {visiblePage}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        if (metadata.next_page) {
                          setPage(metadata.next_page)
                        }
                      }}
                      className={cn(!metadata.next_page && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
