import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
        console.error('Error loading track:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrack()
  }, [slug])

  if (loading || !track) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          {track.cover_url?.large && (
            <div className="relative h-96">
              <img
                src={track.cover_url.large}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {track.title}
            </h3>
            <div className="mt-2 flex items-center">
              {track.user.avatar_url && (
                <img
                  src={track.user.avatar_url}
                  alt={track.user.username}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {track.user.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {track.user.followers_count} followers
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <dl>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2">
                  {track.description}
                </dd>
              </div>
              {track.genre && (
                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Genre
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2">
                    {track.genre}
                  </dd>
                </div>
              )}
              {track.tags && track.tags.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tags
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {track.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
