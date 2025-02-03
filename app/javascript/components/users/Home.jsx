import React, { useEffect, useState } from 'react'
import { useParams, useOutletContext, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import ArticleSide from './ArticleSide'
import TrackPlayer from '../tracks/TrackPlayer'
import { Play, Pause, Share2, Heart, MoreHorizontal } from 'lucide-react'
import PlaylistListItem from './PlaylistItem'
import Albums from './Albums'
import TrackItem from './TrackItem'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function UserHome() {
  const { username } = useParams()
  const { handlePlay, currentTrackId, isPlaying } = useOutletContext()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  const {
    items: tracks,
    loading: loadingTracks,
    lastElementRef
  } = useInfiniteScroll(`/${username}/tracks.json`)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesResponse] = await Promise.all([
          get(`/${username}/articles.json?per=4&order=created_at`),
        ])

        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json
          setArticles(articlesData.collection)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Recent Tracks Section */}
      <Albums/>
      {/* Articles Section */}
      {articles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
          <ArticleSide articles={articles} />
        </div>
      )}


      {tracks.map((track, index) => (
        <TrackItem
          key={track.id}
          track={track}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          elementRef={tracks.length === index + 1 ? lastElementRef : null}
        />
      ))}

      {loadingTracks && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}
    </div>
  )
}
