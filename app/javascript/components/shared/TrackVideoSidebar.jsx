import React, { useEffect, useRef, useState } from "react"
import { get, post } from "@rails/request.js"
import { Link } from "react-router-dom"
import {
  Heart,
  Loader2,
  Maximize2,
  Minimize2,
  Music2,
  PanelRightClose,
  Share2,
  UserCheck,
  UserPlus,
} from "lucide-react"

import useAudioStore from "@/stores/audioStore"
import useAuthStore from "@/stores/authStore"
import usePlayerQueueSheetStore from "@/stores/playerQueueSheetStore"
import useTrackVideoSidebarStore from "@/stores/trackVideoSidebarStore"
import { Button } from "@/components/ui/button"
import usePlayerQueueTracks from "@/hooks/usePlayerQueueTracks"
import useTrackLikeAction from "@/hooks/useTrackLikeAction"
import { useToast } from "@/hooks/use-toast"
import { ShareDialog } from "@/components/ui/share-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

function t(key, options = {}) {
  return I18n.t(`track_video_sidebar.${key}`, options)
}

function currentLocale() {
  return I18n.locale?.startsWith("es") ? "es-CL" : "en-US"
}

function normalizeArtist(data) {
  if (!data?.user) return null

  const user = data.user
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim()

  return {
    ...user,
    full_name: fullName || user.username,
  }
}

function formatCompactCount(value) {
  return new Intl.NumberFormat(currentLocale(), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)
}

export default function TrackVideoSidebar({
  className,
  elevated = false,
  fillHeight = false,
  track: providedTrack = null,
  showShellControls = false,
}) {
  const currentTrackMeta = useAudioStore((state) => state.currentTrackMeta)
  const { currentTrackId, isPlaying } = useAudioStore()
  const { currentUser } = useAuthStore()
  const { toast } = useToast()
  const isExpanded = useTrackVideoSidebarStore((state) => state.isExpanded)
  const close = useTrackVideoSidebarStore((state) => state.close)
  const toggleExpanded = useTrackVideoSidebarStore((state) => state.toggleExpanded)
  const openPlayerQueue = usePlayerQueueSheetStore((state) => state.open)
  const { loading: queueLoading, nextTrack } = usePlayerQueueTracks()
  const { isPending: isLikePending, toggleLike } = useTrackLikeAction()
  const sourceTrack = providedTrack || currentTrackMeta
  const videoRef = useRef(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [trackState, setTrackState] = useState(sourceTrack)
  const [isFollowPending, setIsFollowPending] = useState(false)

  useEffect(() => {
    setTrackState(sourceTrack)
  }, [sourceTrack])

  const track = trackState

  const artistUsername = track?.user?.username || track?.user_username || null
  const artistName =
    artistProfile?.full_name ||
    track?.user?.full_name ||
    track?.user_full_name ||
    artistUsername

  const artworkUrl =
    track?.cover_url?.large ||
    track?.cover_url?.cropped_image ||
    track?.artwork_urls?.large ||
    track?.artwork_url ||
    null

  const isCurrentTrackPlaying =
    isPlaying &&
    currentTrackId !== null &&
    `${currentTrackId}` === `${track?.id}`

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !track?.has_video || !track?.video_url) return

    if (isCurrentTrackPlaying) {
      const playPromise = videoElement.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }
    } else {
      videoElement.pause()
      videoElement.currentTime = 0
    }
  }, [isCurrentTrackPlaying, track?.has_video, track?.video_url])

  useEffect(() => {
    if (!artistUsername) {
      setArtistProfile(null)
      return
    }

    let cancelled = false

    const loadArtist = async () => {
      try {
        const response = await get(`/${artistUsername}.json`, {
          responseKind: "json",
        })

        if (!response.ok) {
          if (!cancelled) {
            setArtistProfile(null)
          }
          return
        }

        const data = await response.json
        if (!cancelled) {
          setArtistProfile(normalizeArtist(data))
        }
      } catch (error) {
        if (!cancelled) {
          setArtistProfile(null)
        }
      }
    }

    loadArtist()

    return () => {
      cancelled = true
    }
  }, [artistUsername])

  if (!track?.id) {
    return null
  }

  const sidebarLabel = track.has_video ? t("video_label") : t("now_playing_label")
  const artistAvatar =
    artistProfile?.avatar_url?.medium ||
    track?.user?.avatar_url?.medium ||
    track?.user_avatar_url?.medium ||
    null
  const artistHeaderUrl =
    artistProfile?.profile_header_url?.large ||
    artistProfile?.profile_header_url?.medium ||
    artistProfile?.profile_header_url?.small ||
    null
  const isLiked = Boolean(track?.like_id || track?.liked_by_current_user)
  const isFollowing = Boolean(artistProfile?.is_following)
  const shareUrl = track?.url
    ? `${window.location.origin}${track.url}`
    : track?.slug
      ? `${window.location.origin}/tracks/${track.slug}`
      : window.location.href
  const nextTrackArtwork =
    nextTrack?.cover_url?.small ||
    nextTrack?.cover_url?.cropped_image ||
    nextTrack?.cover_url?.medium ||
    nextTrack?.user?.avatar_url?.small ||
    null
  const nextTrackArtist =
    nextTrack?.user?.full_name ||
    nextTrack?.user?.name ||
    nextTrack?.user?.username ||
    null
  const statusLabel = isCurrentTrackPlaying ? t("status_playing") : t("status_queued")
  const followLabel = isFollowing ? t("following") : t("follow")
  const likeLabel = I18n.t(isLiked ? "audio_player.unlike" : "audio_player.like")
  const shareDescription = t("share_description", {
    title: track.title,
    artist: artistName,
  })
  const likesBadgeLabel = t("likes_badge", {
    count: formatCompactCount(track.likes_count),
  })

  const patchTrack = (patch) => {
    setTrackState((previousTrack) => (
      previousTrack ? { ...previousTrack, ...patch } : previousTrack
    ))

    if (!providedTrack) {
      useAudioStore.setState((state) => {
        if (!state.currentTrackMeta) return state

        return {
          currentTrackMeta: {
            ...state.currentTrackMeta,
            ...patch,
          },
        }
      })
    }
  }

  const requireAuth = (description) => {
    toast({
      title: I18n.t("audio_player.auth_required_title"),
      description,
      variant: "destructive",
    })
  }

  const handleToggleLike = async () => {
    await toggleLike({
      track,
      onPatch: patchTrack,
    })
  }

  const handleToggleFollow = async () => {
    if (!artistUsername) return

    if (!currentUser) {
      requireAuth(t("auth_follow_required_description"))
      return
    }

    if (isFollowPending) return

    setIsFollowPending(true)

    try {
      const response = await post(`/${artistUsername}/follows`, {
        responseKind: "json",
      })

      if (!response.ok) {
        throw new Error("Unable to update follow")
      }

      const data = await response.json

      setArtistProfile((previousArtist) => (
        previousArtist
          ? {
            ...previousArtist,
            is_following: data.is_following,
            stats: previousArtist.stats
              ? {
                ...previousArtist.stats,
                followers_count: data.following_count,
              }
              : previousArtist.stats,
          }
          : {
            username: artistUsername,
            full_name: artistName,
            avatar_url: artistAvatar ? { medium: artistAvatar } : null,
            is_following: data.is_following,
            stats: {
              followers_count: data.following_count,
              following_count: 0,
              tracks_count: 0,
            },
          }
      ))
    } catch (error) {
      toast({
        title: t("error_title"),
        description: t("follow_error"),
        variant: "destructive",
      })
    } finally {
      setIsFollowPending(false)
    }
  }

  const renderShellControls = ({ overlay = false } = {}) => {
    if (!showShellControls) return null

    const buttonClassName = overlay
      ? "h-9 w-9 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
      : "h-8 w-8 rounded-full"

    return (
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleToggleLike}
          disabled={isLikePending}
          aria-label={likeLabel}
          title={likeLabel}
          className={cn(
            buttonClassName,
            isLiked && (overlay ? "text-rose-300" : "text-rose-500")
          )}
        >
          {isLikePending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          )}
        </Button>

        <ShareDialog
          url={shareUrl}
          title={track.title}
          description={shareDescription}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("share_track")}
            title={t("share_track")}
            className={buttonClassName}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </ShareDialog>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleExpanded}
          aria-label={isExpanded ? t("collapse_panel") : t("expand_panel")}
          title={isExpanded ? t("collapse_panel") : t("expand_panel")}
          className={buttonClassName}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={close}
          aria-label={t("hide_panel")}
          title={t("hide_panel")}
          className={buttonClassName}
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const heroMediaClassName = cn(
    "relative overflow-hidden bg-black",
    track.has_video && track.video_url
      ? isExpanded
        ? "aspect-[16/9]"
        : fillHeight
          ? "aspect-[10/14]"
          : "aspect-[9/16]"
      : isExpanded
        ? "aspect-[16/9]"
        : "aspect-square"
  )
  const heroImageUrl = isExpanded ? (artistHeaderUrl || artworkUrl) : artworkUrl

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border border-border/60 bg-card/90 backdrop-blur",
        elevated && "shadow-[0_24px_60px_rgba(0,0,0,0.22)]",
        fillHeight && "h-full",
        className
      )}
    >
      <div className={cn("flex flex-col", fillHeight && "h-full")}>
        {!isExpanded && (
          <div className="border-b border-border/60 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {sidebarLabel}
              </p>
              <p className="mt-1 truncate text-lg font-semibold text-foreground">
                {track.title}
              </p>
            </div>

            {renderShellControls()}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                isCurrentTrackPlaying
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {statusLabel}
            </span>

            {track.album_title && (
              <span className="truncate text-xs text-muted-foreground">
                {track.album_title}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {likesBadgeLabel}
            </span>

            {track.album_title && (
              <span className="inline-flex rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {track.album_title}
              </span>
            )}

            {artistUsername && (
              <Button
                type="button"
                variant={isFollowing ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleFollow}
                disabled={isFollowPending}
                className="rounded-full"
              >
                {isFollowPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="mr-2 h-4 w-4" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {followLabel}
              </Button>
            )}
          </div>
          </div>
        )}

        <ScrollArea className={cn("min-h-0", fillHeight && "flex-1")}>
          <div className="space-y-4 p-3">
            <section className="overflow-hidden rounded-[24px] border border-border/50 bg-black">
              {track.has_video && track.video_url ? (
                <div className={heroMediaClassName}>
                  <video
                    ref={videoRef}
                    src={track.video_url}
                    poster={artworkUrl}
                    className="h-full w-full object-cover"
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />

                  {isExpanded && (
                    <>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent" />
                      <div className="absolute inset-x-0 top-0 z-10 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-xl font-semibold text-white sm:text-2xl">
                              {track.title}
                            </p>
                            <p className="mt-1 truncate text-sm text-white/70">
                              {artistName}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm",
                                  isCurrentTrackPlaying
                                    ? "border-emerald-300/20 bg-emerald-500/20 text-emerald-100"
                                    : "border-white/15 bg-black/30 text-white/75"
                                )}
                              >
                                {statusLabel}
                              </span>

                              <span className="inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-sm">
                                {likesBadgeLabel}
                              </span>

                              {track.album_title && (
                                <span className="inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-sm">
                                  {track.album_title}
                                </span>
                              )}

                              {artistUsername && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleToggleFollow}
                                  disabled={isFollowPending}
                                  className="h-8 rounded-full border border-white/15 bg-black/30 px-3 text-white backdrop-blur-sm hover:bg-black/45 hover:text-white"
                                >
                                  {isFollowPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : isFollowing ? (
                                    <UserCheck className="mr-2 h-4 w-4" />
                                  ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                  )}
                                  {followLabel}
                                </Button>
                              )}
                            </div>
                          </div>

                          {renderShellControls({ overlay: true })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : heroImageUrl ? (
                <div className={heroMediaClassName}>
                  <img
                    src={heroImageUrl}
                    alt={track.title}
                    className="h-full w-full object-cover"
                  />

                  {isExpanded ? (
                    <>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 top-0 z-10 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-xl font-semibold text-white sm:text-2xl">
                              {track.title}
                            </p>
                            <p className="mt-1 truncate text-sm text-white/70">
                              {artistName}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm",
                                  isCurrentTrackPlaying
                                    ? "border-emerald-300/20 bg-emerald-500/20 text-emerald-100"
                                    : "border-white/15 bg-black/30 text-white/75"
                                )}
                              >
                                {statusLabel}
                              </span>

                              <span className="inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-sm">
                                {likesBadgeLabel}
                              </span>

                              {track.album_title && (
                                <span className="inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-sm">
                                  {track.album_title}
                                </span>
                              )}

                              {artistUsername && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleToggleFollow}
                                  disabled={isFollowPending}
                                  className="h-8 rounded-full border border-white/15 bg-black/30 px-3 text-white backdrop-blur-sm hover:bg-black/45 hover:text-white"
                                >
                                  {isFollowPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : isFollowing ? (
                                    <UserCheck className="mr-2 h-4 w-4" />
                                  ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                  )}
                                  {followLabel}
                                </Button>
                              )}
                            </div>
                          </div>

                          {renderShellControls({ overlay: true })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                  )}
                </div>
              ) : (
                <div className={cn(heroMediaClassName, "flex items-center justify-center bg-muted/20 text-muted-foreground")}>
                  <Music2 className="h-10 w-10" />

                  {isExpanded && (
                    <div className="absolute inset-x-0 top-0 z-10 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-xl font-semibold text-white sm:text-2xl">
                            {track.title}
                          </p>
                          <p className="mt-1 truncate text-sm text-white/70">
                            {artistName}
                          </p>
                        </div>

                        {renderShellControls({ overlay: true })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isExpanded && (
                <div className="border-t border-white/10 bg-neutral-950 px-4 py-4 text-white">
                <p className="truncate text-base font-semibold">{track.title}</p>
                <p className="truncate text-sm text-white/70">{artistName}</p>
                {track.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-white/70">
                    {track.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
                  <span className="rounded-full bg-white/10 px-2.5 py-1">
                    {likesBadgeLabel}
                  </span>
                  {track.album_title && (
                    <span className="rounded-full bg-white/10 px-2.5 py-1">
                      {track.album_title}
                    </span>
                  )}
                  <span className="rounded-full bg-white/10 px-2.5 py-1">
                    {track.has_video ? t("media_type_video") : t("media_type_audio")}
                  </span>
                </div>
                </div>
              )}
            </section>

            <div className="space-y-4">
              <section className="rounded-[24px] border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("artist")}
                </p>

                <div className="mt-4 flex items-center gap-3">
                  {artistAvatar ? (
                    <img
                      src={artistAvatar}
                      alt={artistName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Music2 className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    {artistUsername ? (
                      <Link
                        to={`/${artistUsername}`}
                        className="block truncate text-base font-semibold text-foreground hover:text-primary"
                      >
                        {artistName}
                      </Link>
                    ) : (
                      <p className="truncate text-base font-semibold text-foreground">
                        {artistName}
                      </p>
                    )}

                    {artistUsername && (
                      <p className="truncate text-sm text-muted-foreground">
                        @{artistUsername}
                      </p>
                    )}
                  </div>
                </div>

                {(artistProfile?.stats || artistProfile?.bio) && (
                  <div className="mt-4 space-y-3">
                    {artistProfile?.stats && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl bg-muted/60 px-3 py-3">
                          <p className="text-lg font-semibold text-foreground">
                            {artistProfile.stats.followers_count || 0}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {t("followers")}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-muted/60 px-3 py-3">
                          <p className="text-lg font-semibold text-foreground">
                            {artistProfile.stats.following_count || 0}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {t("following_count")}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-muted/60 px-3 py-3">
                          <p className="text-lg font-semibold text-foreground">
                            {artistProfile.stats.tracks_count || 0}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {t("tracks_count")}
                          </p>
                        </div>
                      </div>
                    )}

                    {artistProfile?.bio && (
                      <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {artistProfile.bio}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t("track_details")}
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{t("title_label")}</span>
                    <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">
                      {track.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{t("album_label")}</span>
                    <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">
                      {track.album_title || t("single_fallback")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{t("format_label")}</span>
                    <span className="text-sm font-medium text-foreground">
                      {track.has_video ? t("format_video_audio") : t("format_audio_only")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{t("likes_label")}</span>
                    <span className="text-sm font-medium text-foreground">
                      {track.likes_count || 0}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-[24px] border border-border/60 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-foreground">
                  {t("next_in_queue")}
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={openPlayerQueue}
                  className="h-auto p-0 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  {t("open_queue")}
                </Button>
              </div>

              <div className="mt-4">
                {queueLoading ? (
                  <p className="text-sm text-muted-foreground">
                    {t("loading_queue")}
                  </p>
                ) : nextTrack ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                    {nextTrackArtwork ? (
                      <img
                        src={nextTrackArtwork}
                        alt={nextTrack.title}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Music2 className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-foreground">
                        {nextTrack.title}
                      </p>
                      {nextTrackArtist && (
                        <p className="truncate text-sm text-muted-foreground">
                          {nextTrackArtist}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("empty_queue")}
                  </p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
