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
      {/* Breadcrumb */}
      <nav className="flex items-start px-4 py-3 sm:px-6 lg:px-8 xl:hidden" aria-label="Breadcrumb">
        <Link
          to={`/users/${track.user.username}`}
          className="inline-flex items-center space-x-3 text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          <svg
            className="-ml-2 h-5 w-5 text-gray-400 dark:text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Tracks</span>
        </Link>
      </nav>

      <article>
        <div>
          <div className="flex flex-col sm:flex-row mb-6">
            <div className="flex-grow items-center text-default">
              {track.cover_url && (
                <img
                  src={track.cover_url.medium}
                  alt={track.title}
                  className="hidden h-32 w-full object-cover lg:h-48"
                />
              )}

              {track.processed && (
                <TrackPlayer
                  url={track.mp3_url}
                  peaks={track.peaks}
                  height={250}
                  id={track.id}
                  urlLink={`/player/${track.id}?t=true`}
                />
              )}
            </div>
          </div>

          <div className="mt-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
              <div className="flex">
                <img
                  src={track.user.avatar_url?.medium}
                  alt={track.user.username}
                  className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-black sm:h-32 sm:w-32"
                />
              </div>
              <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {track.title}
                  </h1>
                  {track.user && (
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      by{' '}
                      <Link
                        to={`/users/${track.user.username}`}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        {track.user.username}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
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
      </article>
    </main>
  )
}
