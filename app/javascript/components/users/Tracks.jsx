import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '@rails/request.js'
import { ModernTrackCell } from '../tracks/TrackCell'
import useAudioStore from '../../stores/audioStore'

export default function UserTracks() {
  const { username } = useParams()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await get(`/${username}/tracks.json`)
        if (response.ok) {
          const data = await response.json
          setTracks(data.tracks)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching tracks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
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
    <div className="space-y-4">
      {tracks.map((track) => (
        <ModernTrackCell
          key={track.id}
          track={track}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          onPlay={() => handlePlay(track.id)}
        />
      ))}
      
      {tracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No tracks found</p>
        </div>
      )}
    </div>
  )
}
