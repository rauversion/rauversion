import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import TrackPlayer from './TrackPlayer'
import { get, post } from '@rails/request.js'
import { Comments } from "@/components/comments/Comments"
import { ShareDialog } from "@/components/ui/share-dialog"
import TrackEdit from './TrackEdit'
import TrackSkeleton from './TrackSkeleton'
import { Settings, Share2, Heart, Repeat, Play, Pause, ShoppingCart } from 'lucide-react'
import { Button } from "@/components/ui/button"
import useAuthStore from '@/stores/authStore'
import { useToast } from "@/hooks/use-toast"
import { useAudioPlaying, } from '@/hooks/useAudioPlaying'
import useAudioStore from '@/stores/audioStore'
import MusicPurchase from '@/components/shared/MusicPurchase'

export default function TrackShow() {
  const { slug } = useParams()
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const { isAuthenticated, currentUser } = useAuthStore()
  const isPlaying = useAudioPlaying()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const { toast } = useToast()

  const { currentTrackId } = useAudioStore()

  const fetchTrack = async () => {
    try {
      const response = await get(`/tracks/${slug}.json`)
      if (response.ok) {
        const data = await response.json
        setTrack(data.track)
        setLikes(data.track.likes_count || 0)
        setIsLiked(data.track.like_id != null)
      }
    } catch (error) {
      console.error('Error fetching track:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrack()
  }, [slug])

  const handlePlay = () => {
    //setCurrentTrackId(track.id)
    if (isPlaying) {
      //audioElement.pause();
      useAudioStore.setState({ isPlaying: false });
      e.preventDefault();
    } else {
      // setTracksToStore(0);
      useAudioStore.setState({ currentTrackId: track.id + "", isPlaying: true });
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like tracks",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await post(`/tracks/${track.slug}/likes`, {
        responseKind: "json"
      })

      if (response.ok) {
        const { liked, resource } = await response.json
        setLikes(resource.likes_count)
        setIsLiked(liked)
        toast({
          title: "Success",
          description: !liked ? "Unliked track!" : "Track liked!"
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || "Error liking track",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error liking track",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <TrackSkeleton />
  }

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Track not found</h1>
        <Link to="/tracks" className="text-primary hover:underline">
          Back to tracks
        </Link>
      </div>
    )
  }

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none xl:order-last">
      <div className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-row gap-8 items-center">
            <div className="flex-1 w-2/3">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <img
                    src={track.user.avatar_url?.medium}
                    alt={track.user.username}
                    className="h-10 w-10 rounded-full shadow-md"
                  />
                </div>
                <div>
                  {/*<Link
                    to={`/${track.user.username}`}
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {track.user.username}
                  </Link>*/}
                  <h1 className="text-xl font-bold text-foreground">
                    {track.title}
                  </h1>
                </div>
              </div>

              {track.processed && (
                <div className="bg-card rounded-lg p-6">
                  <TrackPlayer
                    url={track.mp3_url}
                    peaks={track.peaks}
                    height={100}
                    id={track.id}
                    urlLink={`/player?id=${track.id}?t=true`}
                  />
                </div>
              )}
            </div>
            <div className="w-1/3">
              <div className="relative group">
                <img
                  src={track.cover_url?.cropped_image || track.cover_url?.large || AlbumsHelper.default_image_sqr}
                  alt={track.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                />

                <button
                  onClick={() => handlePlay()}
                  className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {isPlaying && currentTrackId === track.id ? (
                    <Pause className="h-16 w-16 text-primary-foreground" />
                  ) : (
                    <Play className="h-16 w-16 text-primary-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center space-x-4">


              {/* Artists Section */}
              <div className="mt-8">
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
                        <div className="text-base font-medium text-foreground">{track.user.full_name || artist.username}</div>
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
            description={`Listen to ${track.title} by ${track.user.username} on Rauversion`}
          >
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          </ShareDialog>

          {/* Like Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={`flex items-center gap-1 ${isLiked ? 'text-brand-500' : 'text-muted-foreground'}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
            <span className="sr-only">Like</span>
          </Button>

          {/* Repost Button */}
          <Button variant="ghost" size="icon">
            <Repeat className="h-4 w-4" />
            <span className="sr-only">Repost</span>
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
              <span className="sr-only">Edit track</span>
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
                    About
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
                  Buy Link
                </Link>
              )}
            </div>

            {/* Created At */}
            {track.created_at && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Created at
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(track.created_at).toLocaleDateString('en-US', {
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
                  Genre
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
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd
                  className="mt-1 max-w-prose text-sm text-foreground space-y-5"
                  dangerouslySetInnerHTML={{ __html: track.description }}
                />
              </div>
            )}

            {track.label && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Label</dt>
                <dd className="mt-1 text-sm text-foreground">
                  <Link to={`/labels/${track.label.slug}`} className="hover:underline">
                    {track.label.name}
                  </Link>
                </dd>
              </div>
            )}

            {track.genre && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Genre</dt>
                <dd className="mt-1 text-sm text-foreground">{track.genre}</dd>
              </div>
            )}

            {track.tags && track.tags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Tags</dt>
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
            Comments
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
