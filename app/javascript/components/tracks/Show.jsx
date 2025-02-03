import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import TrackPlayer from './TrackPlayer'
import { get } from '@rails/request.js'
import { Comments } from "@/components/comments/Comments"
import { ShareDialog } from "@/components/ui/share-dialog"
import TrackEdit from './TrackEdit'
import { Settings, Share2, Heart, Repeat, Play, Pause } from 'lucide-react'
import { Button } from "@/components/ui/button"
import useAuthStore from '@/stores/authStore'
import { useAudioPlaying , } from '@/hooks/useAudioPlaying'
import useAudioStore from '@/stores/audioStore';

export default function TrackShow() {
  const { slug } = useParams()
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)
  // const [currentTrackId, setCurrentTrackId] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const { currentUser } = useAuthStore()
  const isPlaying = useAudioPlaying()

  const {currentTrackId} = useAudioStore()

  const fetchTrack = async () => {
    try {
      const response = await get(`/tracks/${slug}.json`)
      if (response.ok) {
        const data = await response.json
        setTrack(data.track)
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
    if(isPlaying) {
      //audioElement.pause();
      useAudioStore.setState({ isPlaying: false });
      e.preventDefault();
    } else {
      // setTracksToStore(0);
      useAudioStore.setState({ currentTrackId: track.id + "", isPlaying: true });
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
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
      <div className="bg-gray-900 dark:bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <img
                    src={track.user.avatar_url?.medium}
                    alt={track.user.username}
                    className="h-10 w-10 rounded-full"
                  />
                </div>
                <div>
                  <Link 
                    to={`/${track.user.username}`}
                    className="text-sm font-medium text-gray-300 hover:text-white"
                  >
                    {track.user.username}
                  </Link>
                  <h1 className="text-xl font-bold text-white">
                    {track.title}
                  </h1>
                </div>
              </div>

              {track.processed && (
                <div className="bg-black/30 rounded-lg p-6">
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


            <div className="lg:w-1/3">
              <div className="relative group">
                <img
                  src={track.cover_url?.large || "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"}
                  alt={track.title}
                  className="w-full h-auto rounded-lg"
                />
                
                <button
                  onClick={() => handlePlay()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {isPlaying && currentTrackId === track.id ? (
                    <Pause className="h-16 w-16 text-white" />
                  ) : (
                    <Play className="h-16 w-16 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-end space-x-4">
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
          <Button variant="ghost" size="icon">
            <Heart className="h-4 w-4" />
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
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Description */}
              {track.description && (
                <>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                    About
                  </dt>
                  <dd 
                    className="whitespace-pre-line mt-1 mb-4 max-w-prose text-lg text-gray-900 dark:text-gray-100 space-y-5 prose lg:prose-xl dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: track.description }}
                  />
                </>
              )}

              {/* Buy Link */}
              {track.buy_link && (
                <Link to={track.buy_link} className="underline" target="_blank" rel="noopener noreferrer">
                  Buy Link
                </Link>
              )}
            </div>

            {/* Created At */}
            {track.created_at && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Created at
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
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
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Genre
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
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
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                <dd
                  className="mt-1 max-w-prose text-sm text-gray-900 dark:text-gray-100 space-y-5"
                  dangerouslySetInnerHTML={{ __html: track.description }}
                />
              </div>
            )}

            {track.label && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Label</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <Link to={`/labels/${track.label.slug}`} className="hover:underline">
                    {track.label.name}
                  </Link>
                </dd>
              </div>
            )}

            {track.genre && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Genre</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{track.genre}</dd>
              </div>
            )}

            {track.tags && track.tags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {track.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/tracks?tag=${tag}`}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
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
