import React from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, Share2, Heart, MoreHorizontal } from 'lucide-react'
import TrackPlayer from '../tracks/TrackPlayer'

export default function TrackItem({ 
  track, 
  currentTrackId, 
  isPlaying, 
  onPlay,
  elementRef 
}) {
  const isCurrentTrack = currentTrackId === track.id
  const isCurrentlyPlaying = isCurrentTrack && isPlaying

  return (
    <div
      ref={elementRef}
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
            onClick={() => onPlay(track.id)}
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
}
