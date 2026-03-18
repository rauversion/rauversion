import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Lock, Pause, Play } from 'lucide-react'

import { cn } from "@/lib/utils"
import useAudioStore from '@/stores/audioStore'
import { getUserDisplayName } from '@/utils/userDisplayName'

function showcaseText(key, options = {}) {
  return I18n.t(`users.artist_page.discography.${key}`, options)
}

export function playlistTypeLabel(type) {
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

export function PlaylistShowcaseCard({ playlist, className }) {
  const { currentTrackId, isPlaying, play, pause, setPlaylist } = useAudioStore()
  const tracks = playlist.tracks || []
  const trackIds = tracks.map((track) => `${track.id}`)
  const isPlaylistActive = trackIds.includes(`${currentTrackId}`)
  const playlistPath = `/playlists/${playlist.slug}`

  const handlePlayPlaylist = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!tracks.length) return

    if (isPlaying && isPlaylistActive) {
      pause()
      return
    }

    setPlaylist(tracks)
    useAudioStore.setState({ playlist: trackIds })
    play(tracks[0].id)
  }

  return (
    <article
      className={cn(
        "group h-full overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.10)]",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.18)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={playlistPath} className="block h-full">
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
          onClick={handlePlayPlaylist}
          className={cn(
            "absolute bottom-4 right-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full",
            "border border-white/40 bg-white/15 text-white backdrop-blur transition",
            "hover:scale-105 hover:bg-brand-500"
          )}
          aria-label={
            isPlaying && isPlaylistActive
              ? showcaseText("pause_playlist")
              : showcaseText("play_playlist")
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
            <Link to={playlistPath} className="hover:text-white/90">
              {playlist.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-white/80">
            {getUserDisplayName(playlist.user)}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {displayYear(playlist) && <span>{displayYear(playlist)}</span>}
          <span>{showcaseText("track_count", { count: trackCount(playlist) })}</span>
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {playlist.description || showcaseText("fallback_description")}
        </p>

        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {getUserDisplayName(playlist.user)}
            </p>
            <p className="line-clamp-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {playlistTypeLabel(playlist.playlist_type)}
            </p>
          </div>

          <Link
            to={playlistPath}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-brand-500 dark:bg-white dark:text-black"
            aria-label={showcaseText("open_release", { title: playlist.title })}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function PlaylistShowcaseSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card animate-pulse">
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
  )
}
