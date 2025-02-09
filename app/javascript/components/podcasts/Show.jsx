import React, { useEffect, useState } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { get } from '@rails/request.js'
import { ArrowLeft } from 'lucide-react'
import PlayButton from './PlayButton'

export default function PodcastShow() {
  const { username, id } = useParams()
  const { user } = useOutletContext()
  const [podcast, setPodcast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const response = await get(`/${username}/podcasts/${id}.json`)
        if (response.ok) {
          const data = await response.json
          setPodcast(data)
        }
      } catch (error) {
        console.error('Error fetching podcast:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPodcast()
  }, [username, id])

  if (loading || !podcast) {
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
              <Link to={`/${username}/podcasts`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-700 mb-8">
                <ArrowLeft className="h-4 w-4" />
                Back to Episodes
              </Link>

              <div className="mt-4">
                <time dateTime={podcast.created_at} className="font-mono text-sm leading-7 text-muted">
                  {new Date(podcast.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <h1 className="mt-2 text-3xl font-bold text-default">{podcast.title}</h1>
                
                <div className="mt-4">
                  <PlayButton
                    track={{
                      id: podcast.id,
                      url: podcast.audio_url,
                      title: podcast.title,
                      artist: user?.username,
                      artwork: podcast.image_url
                    }}
                  />
                </div>

                {podcast.image_url && (
                  <img
                    src={podcast.image_url}
                    alt={podcast.title}
                    className="mt-6 rounded-lg object-cover w-full"
                  />
                )}

                <div className="mt-6 text-base leading-7 text-subtle prose prose-invert max-w-none">
                  {podcast.description}
                </div>

                {user?.id === podcast.user_id && (
                  <Link
                    to={`/${username}/podcasts/${id}/edit`}
                    className="mt-6 inline-block text-sm font-medium text-brand-500 hover:text-brand-700"
                  >
                    Edit Episode
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
