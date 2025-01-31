import React from 'react'
import { Link } from 'react-router-dom'
import useAudioStore from '../../stores/audioStore'

const PlayIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
    />
  </svg>
)

const PauseIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
    />
  </svg>
)

// Classic style with circular play button
export function ClassicTrackCell({ track }) {
  const { play, pause, currentTrackId, isPlaying } = useAudioStore()
  const isCurrentTrack = currentTrackId === track.id
  const shouldShowPause = isCurrentTrack && isPlaying

  const handlePlay = (e) => {
    e.preventDefault()
    if (isCurrentTrack && isPlaying) {
      pause()
    } else {
      play(track.id)
    }
  }

  return (
    <Link 
      to={`/tracks/${track.slug}`}
      className="w-64 md:w-48 group space-y-2 p-2 hover:bg-subtle rounded-md"
    >
      <div className="w-full aspect-w-1 aspect-h-1 bg-muted dark:bg-subtle rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
        <div 
          data-track-id={track.id}
          data-audio-id={track.id}
          className="smooth-color group-hover:absolute group-hover:z-10 w-full h-full flex justify-center items-center"
        >
          <button 
            onClick={handlePlay}
            className="smooth-grow flex justify-center items-center w-24 h-24 rounded-full bg-default border-4 border-brand-100 focus:outline-none"
          >
            {shouldShowPause ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </button>
        </div>
        <img 
          src={track.cover_url.medium} 
          alt={track.title}
          className="w-full h-full object-center object-cover group-hover:opacity-75" 
        />
      </div>

      <p className="mt-1 text-lg font-medium leading-none text-gray-900 dark:text-gray-100 truncate">
        {track.title}
      </p>

      <h3 className="text-xs text-gray-700 dark:text-gray-300">
        {track.user.username}
      </h3>
    </Link>
  )
}

// Modern style with overlay play button
export function ModernTrackCell({ track }) {
  const { play, pause, currentTrackId, isPlaying } = useAudioStore()
  const isCurrentTrack = currentTrackId === track.id
  const shouldShowPause = isCurrentTrack && isPlaying

  const handlePlay = (e) => {
    e.preventDefault()
    if (isCurrentTrack && isPlaying) {
      pause()
    } else {
      play(track.id)
    }
  }

  return (
    <Link to={`/tracks/${track.slug}`}>
      <div 
        data-track-id={track.id}
        data-audio-id={track.id}
        className="group cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
          <img 
            src={track.cover_url.medium} 
            alt={track.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
          />
          <button onClick={handlePlay}>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {shouldShowPause ? (
                <PauseIcon className="lucide lucide-play w-12 h-12 text-white" />
              ) : (
                <PlayIcon className="lucide lucide-play w-12 h-12 text-white" />
              )}
            </div>
          </button>
        </div>
        <h3 className="font-bold mb-1 truncate">
          {track.title}
        </h3>
        <p className="text-sm text-gray-400">
          {track.user.username}
        </p>
      </div>
    </Link>
  )
}

// Default export for backward compatibility
export default ModernTrackCell
