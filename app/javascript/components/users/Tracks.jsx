import React from 'react'
import { useParams, Link } from 'react-router-dom'
import useAudioStore from '../../stores/audioStore'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { Play, Pause, Share2, Heart, MoreHorizontal } from 'lucide-react'
import TrackPlayer from '../tracks/TrackPlayer'

export default function UserTracks() {
  const { username } = useParams()
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()
  
  const {
    items: tracks,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/tracks.json`)

  const handlePlay = (trackId) => {
    if (currentTrackId === trackId && isPlaying) {
      pause()
    } else {
      play(trackId)
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-4">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrackId === track.id
        const isCurrentlyPlaying = isCurrentTrack && isPlaying

        return (
          <div
            ref={tracks.length === index + 1 ? lastElementRef : null}
            key={track.id}
            className="bg-gray-900 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <img
                  src={track.cover_url.small}
                  alt={track.title}
                  className="w-full h-full object-cover rounded"
                />
                <button
                  onClick={() => handlePlay(track.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity hover:bg-opacity-50"
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/${track.user.username}/${track.slug}`}
                      className="text-lg font-semibold text-white hover:text-brand-500 truncate block"
                    >
                      {track.title}
                    </Link>
                    <Link
                      to={`/${track.user.username}`}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      {track.user.full_name}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-400 hover:text-white">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                

                <div className="mt-4">
                  <TrackPlayer
                    url={track.audio_url}
                    peaks={track.peaks}
                    id={track.id}
                    disablePlayButton={true}
                    urlLink={`/${track.user.username}/${track.slug}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {tracks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">No tracks found</p>
        </div>
      )}
    </div>
  )
}
