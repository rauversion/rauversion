import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import TrackPlayer from './TrackPlayer'
import { get } from '@rails/request.js'

export default function TrackShow() {
  const { slug } = useParams()
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

    fetchTrack()
  }, [slug])

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
              <img
                src={track.cover_url?.large || "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"}
                alt={track.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-end space-x-4">
          {/* Share Button */}
          <button className="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>

          {/* Like Button */}
          <button className="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Like</span>
          </button>

          {/* Repost Button */}
          <button className="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Repost</span>
          </button>

          {/* Edit Button */}
          <Link to={`/tracks/${track.slug}/edit`} className="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Edit</span>
          </Link>
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
    </main>
  )
}
