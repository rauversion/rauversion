import React, { useEffect, useState } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { get } from '@rails/request.js'
import { ArrowLeft } from 'lucide-react'
import PlayButton from './PlayButton'

function formatPodcastDate(value) {
  if (!value) return null

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

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

  const coverImageUrl =
    podcast.image_url ||
    podcast.cover_url?.cropped_image ||
    podcast.cover_url ||
    null
  const formattedDate = formatPodcastDate(podcast.created_at)

  return (
    <div className="relative w-full">
      <div className="pb-12 pt-16 sm:pb-4 lg:pt-12">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16">
          <div className="w-full">
            <Link to={`/${username}/podcasts`} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Episodes
            </Link>

            <div className="mt-4">
              {formattedDate && (
                <time dateTime={podcast.created_at} className="font-mono text-sm leading-7 text-muted">
                  {formattedDate}
                </time>
              )}
              <h1 className="mt-2 text-3xl font-bold text-default">{podcast.title}</h1>
              
              <div className="mt-4">
                <PlayButton
                  track={{
                    id: podcast.id,
                    url: podcast.audio_url,
                    title: podcast.title,
                    artist: user?.username,
                    artwork: coverImageUrl
                  }}
                />
              </div>

              {coverImageUrl && (
                <div className="mt-6 w-full overflow-hidden rounded-lg">
                  <div className="relative aspect-[16/9] w-full">
                    <img
                      src={coverImageUrl}
                      alt={podcast.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="prose prose-invert mt-6 max-w-none text-base leading-7 text-subtle">
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
  )
}
