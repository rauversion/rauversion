import React from 'react'
import { Link } from 'react-router-dom'
import useAudioStore from '../../stores/audioStore'
import { truncate } from '../../utils/text'

export default function TrackCell({ track, size = 'medium', showPlayButton = true }) {
  const { setCurrentTrackId } = useAudioStore()

  const handlePlay = (e) => {
    e.preventDefault()
    setCurrentTrackId(track.id)
  }

  const sizeClasses = {
    small: 'w-48 md:w-36',
    medium: 'w-64 md:w-48',
    large: 'w-72 md:w-56'
  }

  return (
    <Link
      to={`/tracks/${track.slug}`}
      className={`${sizeClasses[size]} group space-y-2 p-2 hover:bg-subtle rounded-md`}
    >
      <div className="w-full aspect-w-1 aspect-h-1 bg-muted dark:bg-subtle rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
        {showPlayButton && (
          <div
            className="smooth-color group-hover:absolute group-hover:z-10 w-full h-full flex justify-center items-center"
          >
            <button
              onClick={handlePlay}
              className="smooth-grow flex justify-center items-center w-24 h-24 rounded-full bg-default border-4 border-brand-100 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                />
              </svg>
            </button>
          </div>
        )}
        {track.cover_url?.medium && (
          <img
            src={track.cover_url.medium}
            alt={track.title}
            className="w-full h-full object-center object-cover group-hover:opacity-75"
          />
        )}
      </div>

      <p className="mt-1 text-lg font-medium leading-none text-gray-900 dark:text-gray-100 truncate">
        {truncate(track.title, 50)}
      </p>

      <h3 className="mt-4 text-xs text-gray-700 dark:text-gray-300">
        {truncate(track.user.username, 30)}
      </h3>
    </Link>
  )
}
