import React, { useEffect, useState } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { get } from '@rails/request.js'
import PlayButton from './PlayButton'

export default function PodcastsIndex() {
  const { username } = useParams()
  const { user } = useOutletContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get(`/${username}/podcasts.json?page=${page}`)
        if (response.ok) {
          const jsonData = await response.json
          setData(prev => {
            if (prev && page > 1) {
              return {
                ...jsonData,
                collection: [...prev.collection, ...jsonData.collection]
              }
            }
            return jsonData
          })
          setHasMore(!jsonData.metadata.is_last_page)
        }
      } catch (error) {
        console.error('Error fetching podcasts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, page])

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="pb-12 pt-16 sm:pb-4 lg:pt-12">
        <div className="lg:px-8">
          <div className="lg:max-w-4xl">
            <div className="mx-auto px-4 sm:px-6 md:max-w-2xl md:px-4 lg:px-0">
              <h1 className="text-2xl font-bold leading-7 text-default">
                Episodes
              </h1>
            </div>
          </div>
        </div>
        <div className="divide-y divide-muted sm:mt-4 lg:mt-8 lg:border-t lg:border-subtle">
          {data?.collection?.map((track) => (
            <article
              key={track.id}
              aria-labelledby={`episode-${track.id}`}
              className="py-10 sm:py-12"
            >
              <div className="lg:px-8">
                <div className="lg:max-w-4xl">
                  <div className="mx-auto px-4 sm:px-6 md:max-w-2xl md:px-4 lg:px-0">
                    <div className="flex flex-col items-start">
                      <h2
                        id={`episode-${track.id}`}
                        className="mt-2 text-lg font-bold text-default"
                      >
                        <Link to={`/${username}/podcasts/${track.slug}`}>
                          {track.title}
                        </Link>
                      </h2>

                      <img src={track.cover_url} alt="" className="my-2 rounded-lg object-cover w-full group-hover:scale-105 transition-transform duration-500" />


                      <time
                        dateTime={track.created_at}
                        className="order-first font-mono text-sm leading-7 text-muted"
                      >
                        {new Date(track.created_at).toLocaleDateString('default', { 
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>

                      <p className="mt-1 text-base leading-7 text-subtle">
                        {track.description}
                      </p>

                      <div className="mt-4">
                        <PlayButton
                          track={{
                            id: track.id,
                            url: track.audio_url,
                            title: track.title,
                            artist: user?.username,
                            artwork: track.cover_url
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
