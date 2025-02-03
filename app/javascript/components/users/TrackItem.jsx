import React from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause } from 'lucide-react'
import TrackPlayer from '../tracks/TrackPlayer'
import TrackItemMenu from './TrackItemMenu'

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

            <TrackItemMenu track={track} />
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
          
          {track.tag_list && track.tag_list.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {track.tag_list.map((tag, index) => (
                <Link
                  key={index}
                  to={`/tracks/tags/${tag}`}
                  className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
