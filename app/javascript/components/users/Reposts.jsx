import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import { ModernTrackCell } from '../tracks/TrackCell'
import useAudioStore from '../../stores/audioStore'

export default function UserReposts() {
  const { username } = useParams()
  const [reposts, setReposts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  useEffect(() => {
    const fetchReposts = async () => {
      try {
        const response = await get(`/${username}/reposts.json`)
        if (response.ok) {
          const data = await response.json
          setReposts(data.collection)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching reposts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReposts()
  }, [username])

  const handlePlay = (trackId) => {
    if (currentTrackId === trackId && isPlaying) {
      pause()
    } else {
      play(trackId)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {reposts.map((repost) => {
        const { repostable } = repost

        if (repostable.type === 'track') {
          return (
            <div key={repost.id} className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Reposted on {new Date(repost.created_at).toLocaleDateString()}
              </div>
              <ModernTrackCell
                track={repostable}
                currentTrackId={currentTrackId}
                isPlaying={isPlaying}
                onPlay={() => handlePlay(repostable.id)}
              />
            </div>
          )
        }

        if (repostable.type === 'playlist') {
          return (
            <div key={repost.id} className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Reposted on {new Date(repost.created_at).toLocaleDateString()}
              </div>
              <Link
                to={`/playlists/${repostable.slug}`}
                className="block group bg-card rounded-lg overflow-hidden"
              >
                <div className="flex items-center p-4">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={repostable.cover_url.medium}
                      alt={repostable.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium group-hover:text-primary-500 transition-colors duration-200">
                      {repostable.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {repostable.tracks_count} tracks
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      By {repostable.author.username}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )
        }

        return null
      })}
      
      {reposts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reposts found</p>
        </div>
      )}
    </div>
  )
}
