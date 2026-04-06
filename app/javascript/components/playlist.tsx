import React, { useEffect, useMemo, useState } from "react"
import { Play, Pause } from "lucide-react"
import { getUserDisplayName } from "@/utils/userDisplayName"
import { buildPlaylistPalette, resolvePlaylistCoverUrl } from "@/lib/playlist-theme"
import type { TemplateStyle } from "@/lib/blocks/types"
import useAudioStore from "@/stores/audioStore"

interface Track {
  id: number
  title: string
  description: string
  duration: number | string | null
  audio_url: string
  cover_url: string
  position: number
  author?: User
  user?: User
}

interface User {
  id: number
  username: string
  display_name?: string
  full_name: string
  avatar_url: string
}

interface PlaylistMetadata {
  buy_link: string
  buy_link_title: string
  buy: boolean
  record_label: string
}

interface Playlist {
  id: number
  title: string
  slug: string
  url?: string
  description: string
  playlist_type: string
  private: boolean
  // metadata: PlaylistMetadata;
  buy: boolean
  buy_link: string
  buy_link_title: string
  created_at: string
  updated_at: string
  user: User
  label?: User
  cover_url: string | { small?: string; medium?: string; large?: string; cropped_image?: string }
  tracks: Track[]
  likes_count: number
  comments_count: number
  author: User
}

interface PlaylistProps {
  playlistId: string | number
  primaryColor?: string
  template?: TemplateStyle
  themeMode?: "dark" | "light"
  height?: number
}

function formatTrackDuration(duration: number | string | null | undefined) {
  if (duration === null || duration === undefined || duration === "") {
    return ""
  }

  const parsedDuration = typeof duration === "number" ? duration : Number(duration)

  if (Number.isNaN(parsedDuration)) {
    return ""
  }

  const totalSeconds = Math.floor(parsedDuration)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function PlaylistComponent({
  playlistId,
  primaryColor,
  template,
  themeMode = "dark",
  height = 560,
}: PlaylistProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentTrackId = useAudioStore((state) => state.currentTrackId)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const play = useAudioStore((state) => state.play)
  const pause = useAudioStore((state) => state.pause)
  const setAudioPlaylist = useAudioStore((state) => state.setPlaylist)

  const trackIds = useMemo(
    () => (playlist?.tracks || []).map((track) => `${track.id}`).filter(Boolean),
    [playlist]
  )
  const activeTrackIndex = useMemo(
    () => playlist?.tracks.findIndex((track) => `${track.id}` === `${currentTrackId}`) ?? -1,
    [currentTrackId, playlist]
  )
  const isPlaylistActive = useMemo(
    () => trackIds.includes(`${currentTrackId}`),
    [currentTrackId, trackIds]
  )

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistId) {
        setPlaylist(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/playlists/${playlistId}.json`)
        if (!response.ok) {
          throw new Error("Failed to fetch playlist")
        }
        const data = await response.json()
        setPlaylist(normalizePlaylist(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylist()
  }, [playlistId])

  const ensurePlaylistQueue = () => {
    if (trackIds.length > 0) {
      setAudioPlaylist(trackIds)
    }
  }

  const handlePlayPlaylist = () => {
    if (!playlist?.tracks?.length) return

    ensurePlaylistQueue()

    if (isPlaylistActive && isPlaying) {
      pause()
      return
    }

    const nextTrackId =
      isPlaylistActive && activeTrackIndex >= 0
        ? playlist.tracks[activeTrackIndex].id
        : playlist.tracks[0].id

    play(nextTrackId)
  }

  const handleTrackPlay = (trackId: number) => {
    ensurePlaylistQueue()

    if (`${currentTrackId}` === `${trackId}` && isPlaying) {
      pause()
      return
    }

    play(trackId)
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>
  if (error) return <div className="text-destructive">Error: {error}</div>
  if (!playlist) return <div className="text-muted-foreground">No playlist found</div>

  const playlistCoverUrl = resolvePlaylistCoverUrl(playlist.cover_url)
  const playlistHref = playlist.url || (playlist.slug ? `/playlists/${playlist.slug}` : undefined)
  const palette = buildPlaylistPalette({ primaryColor, template, themeMode })
  const trackListHeight = Math.max(height - 230, 180)

  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={
        {
          height,
          background: palette.surface,
          borderColor: palette.border,
          color: palette.text,
          "--playlist-accent": palette.accent,
          "--playlist-text": palette.text,
          "--playlist-muted": palette.muted,
          "--playlist-panel": palette.panel,
          "--playlist-border": palette.border,
          "--playlist-accent-soft": palette.accentSoft,
        } as React.CSSProperties
      }
    >
      <div className="flex items-start gap-6">
        {playlistCoverUrl && (
          <img 
            src={playlistCoverUrl} 
            alt={playlist.title}
            className="h-[160px] w-[160px] rounded-xl object-cover shadow-lg"
          />
        )}
        
        <div className="flex-1">
          <h2 className="mb-2 text-3xl font-bold text-[var(--playlist-text)]">{playlist.title}</h2>
          <p className="mb-4 text-[var(--playlist-muted)]">{getUserDisplayName(playlist.user)}</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePlayPlaylist}
              className="rounded-full p-3 font-semibold text-white transition hover:scale-105"
              style={{ backgroundColor: palette.accent }}
            >
              {isPlaying && isPlaylistActive ? <Pause size={24} /> : <Play size={24} />}
            </button>
            {playlistHref && (
              <a
                href={playlistHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-4 py-1.5 text-xs font-semibold text-[var(--playlist-text)] transition hover:scale-105"
                style={{ borderColor: palette.border }}
              >
                Listen on Rauversion
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div
          className="space-y-1 overflow-y-auto rounded-xl border p-3 md:p-4"
          style={{
            height: trackListHeight,
            background: palette.panel,
            borderColor: palette.border,
          }}
        >
          {playlist.tracks.map((track, index) => {
            const formattedDuration = formatTrackDuration(track.duration)
            const trackAuthor = track.author || track.user
            const isCurrentTrack = `${currentTrackId}` === `${track.id}`
            const isCurrentTrackPlaying = isCurrentTrack && isPlaying

            return (
              <div 
                key={track.id}
                className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[var(--playlist-accent-soft)]"
                style={isCurrentTrack ? { background: palette.accentSoft } : undefined}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-[var(--playlist-muted)]">{index + 1}</span>
                  
                  <button 
                    className="text-[var(--playlist-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--playlist-accent)]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTrackPlay(track.id)
                    }}
                  >
                    {isCurrentTrackPlaying ? 
                      <Pause size={20} /> : 
                      <Play size={20} />
                    }
                  </button>

                  <div>
                    <p className="font-medium text-[var(--playlist-text)]">{track.title}</p>
                    <p className="text-sm text-[var(--playlist-muted)]">{trackAuthor ? getUserDisplayName(trackAuthor) : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--playlist-muted)]">{formattedDuration}</span>

                </div>
              </div>
            )
          })}
        </div>
      </div>

      {playlist.buy && (
        <div className="mt-6 text-center">
          <a 
            href={playlist.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border px-4 py-1.5 text-xs font-semibold text-[var(--playlist-text)] transition hover:scale-105"
            style={{ borderColor: palette.border }}
          >
            {playlist.buy_link_title || 'Buy Now'}
          </a>
        </div>
      )}
    </div>
  )
}

function normalizePlaylist(data: any): Playlist | null {
  const playlist = data?.playlist || data
  if (!playlist?.id) return null

  return {
    ...playlist,
    tracks: Array.isArray(playlist.tracks) ? playlist.tracks : [],
  }
}
