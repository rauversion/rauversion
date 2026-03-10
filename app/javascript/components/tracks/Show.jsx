import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import TrackPlayer from './TrackPlayer'
import { get } from '@rails/request.js'
import { Comments } from "@/components/comments/Comments"
import { ShareDialog } from "@/components/ui/share-dialog"
import TrackEdit from './TrackEdit'
import TrackSkeleton from './TrackSkeleton'
import { Settings, Share2, Heart, Repeat, Play, Pause } from 'lucide-react'
import { Button } from "@/components/ui/button"
import useAuthStore from '@/stores/authStore'
import useAudioStore from '@/stores/audioStore'
import MusicPurchase from '@/components/shared/MusicPurchase'
import useTrackLikeAction from "@/hooks/useTrackLikeAction"

function t(key, options = {}) {
  return I18n.t(`tracks.show.${key}`, options)
}

function currentLocale() {
  return I18n.locale?.startsWith("es") ? "es-CL" : "en-US"
}

function playlistTypeLabel(playlistType) {
  switch (playlistType) {
    case 'album':
      return I18n.t('tracks.show.playlist_types.album')
    case 'ep':
      return I18n.t('tracks.show.playlist_types.ep')
    case 'single':
      return I18n.t('tracks.show.playlist_types.single')
    case 'compilation':
      return I18n.t('tracks.show.playlist_types.compilation')
    default:
      return I18n.t('tracks.show.playlist_types.playlist')
  }
}

function releaseYear(releaseDate) {
  if (!releaseDate) return null

  const date = new Date(releaseDate)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

export default function TrackShow() {
  const { slug } = useParams()
  const [track, setTrack] = useState(null)
  const [appearsOnPlaylists, setAppearsOnPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const { currentUser } = useAuthStore()
  const { isPending: isLikePending, toggleLike } = useTrackLikeAction()

  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  const fetchTrack = async () => {
    setLoading(true)

    try {
      const [trackResponse, appearsOnResponse] = await Promise.all([
        get(`/tracks/${slug}.json`),
        get(`/tracks/${slug}/appears_on.json`)
      ])

      if (trackResponse.ok) {
        const data = await trackResponse.json
        setTrack(data.track)
      } else {
        setTrack(null)
      }

      if (appearsOnResponse.ok) {
        const data = await appearsOnResponse.json
        setAppearsOnPlaylists(Array.isArray(data.playlists) ? data.playlists : [])
      } else {
        setAppearsOnPlaylists([])
      }
    } catch (error) {
      console.error('Error fetching track:', error)
      setTrack(null)
      setAppearsOnPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrack()
  }, [slug])

  const handlePlay = () => {
    if (!track?.id) return

    const trackId = `${track.id}`
    const isCurrentTrack = currentTrackId !== null && `${currentTrackId}` === trackId

    if (isCurrentTrack && isPlaying) {
      pause()
      return
    }

    play(trackId)
  }

  const handleLike = async () => {
    await toggleLike({
      track,
      onPatch: (patch) => {
        setTrack((previousTrack) => (
          previousTrack ? { ...previousTrack, ...patch } : previousTrack
        ))
      },
    })
  }

  const isCurrentTrackPlaying =
    isPlaying &&
    currentTrackId !== null &&
    `${currentTrackId}` === `${track?.id}`

  if (loading) {
    return <TrackSkeleton />
  }

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">{t("not_found_title")}</h1>
        <Link to="/tracks" className="text-primary hover:underline">
          {t("back_to_tracks")}
        </Link>
      </div>
    )
  }
  const likes = track.likes_count || 0
  const isLiked = Boolean(track.like_id || track.liked_by_current_user)
  const shareDescription = t("share_description", {
    title: track.title,
    artist: track.user.full_name || track.user.username,
  })

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none xl:order-last">
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-w-0 max-w-5xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
              <div className="order-2 w-full md:order-1 md:w-2/3">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <img
                      src={track.user.avatar_url?.medium}
                      alt={track.user.username}
                      className="h-10 w-10 rounded-full shadow-md"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {track.title}
                    </h1>
                  </div>
                </div>

                {track.processed && (
                  <div className="bg-card rounded-lg p-6">
                    <TrackPlayer
                      url={track.playback_url || track.mp3_audio_url || track.mp3_url || track.audio_url}
                      peaks={track.peaks}
                      height={100}
                      id={track.id}
                      urlLink={`/player?id=${track.id}?t=true`}
                    />
                  </div>
                )}
              </div>
              <div className="order-1 w-full md:order-2 md:w-1/3">
                <div className="relative mx-auto w-full max-w-xs md:max-w-none">
                  <img
                    src={track.cover_url?.cropped_image || track.cover_url?.large || AlbumsHelper.default_image_sqr}
                    alt={track.title}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                  <button
                    type="button"
                    onClick={() => handlePlay()}
                    aria-label={isCurrentTrackPlaying ? t("pause_track") : t("play_track")}
                    className="absolute bottom-3 left-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/90 text-white shadow-2xl ring-2 ring-white/80 transition-all duration-200 hover:scale-105 hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/60 dark:bg-white/90 dark:text-black dark:ring-black/40 md:bottom-4 md:left-4 md:h-14 md:w-14"
                  >
                    {isCurrentTrackPlaying ? (
                      <Pause className="h-6 w-6 md:h-7 md:w-7" />
                    ) : (
                      <Play className="h-6 w-6 translate-x-[1px] md:h-7 md:w-7" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="space-y-8">


              {/* Artists Section */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  {I18n.t('profile.artists')}
                </h2>
                <ul className="flex flex-col gap-4">

                  <li key={track.user.id} className="flex items-center gap-4">
                    <Link
                      className="flex items-center gap-4"
                      to={`/${track.user.username}`}>
                      <img
                        src={track.user.avatar_url?.medium || track.user.avatar_url?.default}
                        alt={track.user.name}
                        className="h-12 w-12 rounded-full object-cover shadow"
                      />
                      <div>
                        <div className="text-base font-medium text-foreground">{track.user.full_name || track.user.username}</div>
                      </div>
                    </Link>
                  </li>

                  {track.artists && track.artists.length > 0 && track.artists.map((artist) => (
                    <li key={artist.id}>
                      <Link
                        className="flex items-center gap-4"
                        to={`/${artist.username}`}>
                        <img
                          src={artist.avatar_url?.medium || artist.avatar_url?.default}
                          alt={artist.name}
                          className="h-12 w-12 rounded-full object-cover shadow"
                        />
                        <div>
                          <div className="text-base font-medium text-foreground">{artist.full_name || artist.username}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {appearsOnPlaylists.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-foreground">
                    {I18n.t('tracks.show.appears_on')}
                  </h2>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {appearsOnPlaylists.map((playlist) => {
                      const year = releaseYear(playlist.release_date)

                      return (
                        <Link
                          key={playlist.id}
                          to={`/playlists/${playlist.slug}`}
                          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/70 p-3 transition-colors hover:border-primary/40 hover:bg-card"
                        >
                          <img
                            src={playlist.cover_url?.cropped_image || playlist.cover_url?.medium}
                            alt={playlist.title}
                            className="h-16 w-16 shrink-0 rounded-xl object-cover shadow"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                {playlistTypeLabel(playlist.playlist_type)}
                              </span>

                              {year && (
                                <span className="text-xs text-muted-foreground">
                                  {year}
                                </span>
                              )}

                              {playlist.private && (
                                <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                  {I18n.t('tracks.private_label')}
                                </span>
                              )}
                            </div>

                            <p className="mt-2 truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                              {playlist.title}
                            </p>

                            <p className="truncate text-sm text-muted-foreground">
                              {playlist.user?.full_name || playlist.user?.username}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

          </div>
        </div>
      </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-end space-x-4">
          <MusicPurchase resource={track} type="Track" variant="mini" />

          {/* Share Button */}
          <ShareDialog
            url={`${window.location.origin}/${track.user.username}/tracks/${track.slug}`}
            title={track.title}
            description={shareDescription}
          >
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
              <span className="sr-only">{t("share")}</span>
            </Button>
          </ShareDialog>

          {/* Like Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={isLikePending}
            className={`flex items-center gap-1 ${isLiked ? 'text-brand-500' : 'text-muted-foreground'} ${isLikePending ? 'cursor-wait opacity-70' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
            <span className="sr-only">{I18n.t(isLiked ? "audio_player.unlike" : "audio_player.like")}</span>
          </Button>

          {/* Repost Button */}
          <Button variant="ghost" size="icon">
            <Repeat className="h-4 w-4" />
            <span className="sr-only">{t("repost")}</span>
          </Button>

          {/* Edit Button */}
          {currentUser?.id === track.user.id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t("edit_track")}</span>
            </Button>
          )}
        </div>

        <div className="mt-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {/* Tags */}
              {track.tags && track.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {track.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/tracks?tag=${tag}`}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Description */}
              {track.description && (
                <>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t("about")}
                  </dt>
                  <dd
                    className="whitespace-pre-line mt-1 mb-4 max-w-prose text-lg text-foreground space-y-5 prose lg:prose-xl dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: track.description }}
                  />
                </>
              )}

              {/* Buy Link */}
              {track.buy_link && (
                <Link to={track.buy_link} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer">
                  {t("buy_link")}
                </Link>
              )}
            </div>

            {/* Created At */}
            {track.created_at && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t("created_at")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(track.created_at).toLocaleDateString(currentLocale(), {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            )}

            {/* Genre */}
            {track.genre && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t("genre")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {track.genre}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {track.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">{t("description")}</dt>
                <dd
                  className="mt-1 max-w-prose text-sm text-foreground space-y-5"
                  dangerouslySetInnerHTML={{ __html: track.description }}
                />
              </div>
            )}

            {track.label && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">{t("label")}</dt>
                <dd className="mt-1 text-sm text-foreground">
                  <Link to={`/labels/${track.label.slug}`} className="hover:underline">
                    {track.label.name}
                  </Link>
                </dd>
              </div>
            )}

            {track.genre && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">{t("genre")}</dt>
                <dd className="mt-1 text-sm text-foreground">{track.genre}</dd>
              </div>
            )}

            {track.tags && track.tags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">{t("tags")}</dt>
                <dd className="mt-1 text-sm text-foreground">
                  <div className="flex flex-wrap gap-2">
                    {track.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/tracks?tag=${tag}`}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {t("comments")}
          </h2>
          <Comments
            resourceType="track"
            resourceId={track.slug}
          />
        </div>
      </div>

      {track && currentUser?.id === track.user.id && (
        <TrackEdit
          track={track}
          open={editOpen}
          onOpenChange={setEditOpen}
          onOk={fetchTrack}
        />
      )}
    </main>
  )
}
