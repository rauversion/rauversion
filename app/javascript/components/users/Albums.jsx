import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import { motion } from 'framer-motion'
import { ArrowUpRight, Disc3, Lock, Pause, Play } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import useAudioStore from '@/stores/audioStore'

const CATEGORIES = ['playlist', 'album', 'ep', 'single', 'compilation']

function playlistTypeLabel(type) {
  const playlistType = type || 'playlist'
  return I18n.t(`tracks.show.playlist_types.${playlistType}`, {
    defaultValue: playlistType.charAt(0).toUpperCase() + playlistType.slice(1),
  })
}

function coverFor(playlist) {
  return (
    playlist.cover_url?.cropped_image ||
    playlist.cover_url?.large ||
    playlist.cover_url?.medium ||
    playlist.cover_url?.small
  )
}

function displayYear(playlist) {
  const rawDate = playlist.release_date || playlist.created_at
  if (!rawDate) return null

  const date = new Date(rawDate)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

function trackCount(playlist) {
  return playlist.tracks_count || playlist.tracks?.length || 0
}

function discographyText(key, options = {}) {
  return I18n.t(`users.artist_page.discography.${key}`, options)
}

function PlaylistShowcaseCard({
  playlist,
  index,
  currentTrackId,
  isPlaying,
  onPlayPlaylist,
}) {
  const playlistTrackIds = (playlist.tracks || []).map((track) => `${track.id}`)
  const isPlaylistActive = playlistTrackIds.includes(`${currentTrackId}`)

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={cn(
        "group overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.10)]",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={`/playlists/${playlist.slug}`} className="block h-full">
          <img
            src={coverFor(playlist)}
            alt={playlist.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
        </Link>

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-900 backdrop-blur">
            {playlistTypeLabel(playlist.playlist_type)}
          </span>

          {playlist.private && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              <Lock className="h-3.5 w-3.5" />
              {I18n.t("tracks.private_label")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onPlayPlaylist(playlist)
          }}
          className={cn(
            "absolute bottom-4 right-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full",
            "border border-white/40 bg-white/15 text-white backdrop-blur transition",
            "hover:scale-105 hover:bg-brand-500"
          )}
          aria-label={
            isPlaying && isPlaylistActive
              ? discographyText("pause_playlist")
              : discographyText("play_playlist")
          }
        >
          {isPlaying && isPlaylistActive ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-[1px]" />
          )}
        </button>

        <div className="absolute inset-x-4 bottom-4">
          <h3 className="line-clamp-2 text-xl font-black leading-tight text-white">
            <Link to={`/playlists/${playlist.slug}`} className="hover:text-white/90">
              {playlist.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-white/80">
            {playlist.user?.full_name || playlist.user?.username}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {displayYear(playlist) && <span>{displayYear(playlist)}</span>}
          <span>{discographyText("track_count", { count: trackCount(playlist) })}</span>
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {playlist.description || discographyText("fallback_description")}
        </p>

        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {playlist.user?.full_name || playlist.user?.username}
            </p>
            <p className="line-clamp-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {playlistTypeLabel(playlist.playlist_type)}
            </p>
          </div>
          <Link
            to={`/playlists/${playlist.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-brand-500 dark:bg-white dark:text-black"
            aria-label={discographyText("open_release", { title: playlist.title })}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

export default function UserAlbums() {
  const { username } = useParams()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { currentTrackId, isPlaying, play, pause, setPlaylist } = useAudioStore()

  useEffect(() => {
    let cancelled = false

    const fetchAlbums = async () => {
      setLoading(true)

      const url = selectedCategory
        ? `/${username}/playlists_filter.json?kind=${selectedCategory}`
        : `/${username}/albums.json`

      try {
        const response = await get(url)
        if (!response.ok) return

        const data = await response.json
        if (!cancelled) {
          setAlbums(Array.isArray(data.collection) ? data.collection : [])
        }
      } catch (error) {
        console.error('Error fetching albums:', error)
        if (!cancelled) {
          setAlbums([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAlbums()

    return () => {
      cancelled = true
    }
  }, [username, selectedCategory])

  const toggleCategory = (category) => {
    setSelectedCategory((current) => (current === category ? null : category))
  }

  const handlePlayPlaylist = (playlist) => {
    const tracks = playlist.tracks || []
    if (!tracks.length) return

    const trackIds = tracks.map((track) => `${track.id}`)
    const isPlaylistActive = trackIds.includes(`${currentTrackId}`)

    if (isPlaying && isPlaylistActive) {
      pause()
      return
    }

    setPlaylist(tracks)
    useAudioStore.setState({ playlist: trackIds })
    play(tracks[0].id)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-400">
            <Disc3 className="h-3.5 w-3.5" />
            {discographyText("badge")}
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {discographyText("title")}
          </h2>
          <p className="hidden mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {discographyText("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              onClick={() => toggleCategory(category)}
              className={cn(
                "rounded-full border-border/70 bg-background/80 px-4 capitalize text-muted-foreground shadow-sm transition",
                "hover:border-brand-400 hover:text-foreground",
                selectedCategory === category && "border-brand-500 bg-brand-500 text-white hover:bg-brand-500 hover:text-white"
              )}
            >
              {playlistTypeLabel(category)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((placeholder) => (
            <div
              key={placeholder}
              className="overflow-hidden rounded-[28px] border border-border/60 bg-card animate-pulse"
            >
              <div className="aspect-[4/3] bg-muted/60" />
              <div className="space-y-4 p-5">
                <div className="h-3 w-28 rounded-full bg-muted/60" />
                <div className="h-6 w-3/4 rounded-full bg-muted/60" />
                <div className="h-20 rounded-3xl bg-muted/50" />
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded-full bg-muted/60" />
                    <div className="h-3 w-20 rounded-full bg-muted/50" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {albums.map((album, index) => (
            <PlaylistShowcaseCard
              key={album.id}
              playlist={album}
              index={index}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onPlayPlaylist={handlePlayPlaylist}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-border bg-black/5 px-6 py-12 text-center dark:bg-white/5">
          <p className="text-base font-medium text-foreground">{discographyText("empty_title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {discographyText("empty_description")}
          </p>
        </div>
      )}
    </section>
  )
}
