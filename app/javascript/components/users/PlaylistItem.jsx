import React from 'react'
import { Play, Pause } from 'lucide-react'

export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function PlaylistListItem({ track, index, currentTrackId, isPlaying, onPlay }) {
  return (
    <div 
      key={track.id}
      className={`flex items-center justify-between p-2 rounded hover:bg-white hover:bg-opacity-10 group ${
        currentTrackId === track.id ? 'bg-white bg-opacity-20' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`w-6 ${currentTrackId === track.id ? 'text-brand-500' : 'text-zinc-400'}`}>
          {index + 1}
        </span>
        
        <button 
          onClick={onPlay}
          className="cursor-pointer"
        >
          {currentTrackId === track.id && isPlaying ? 
            <Pause size={20} /> : 
            <Play size={20} />
          }
        </button>

        <div>
          <p className={`font-medium ${
            currentTrackId === track.id ? 'text-brand-500' : 'text-white'
          }`}>
            {track.title}
          </p>
          <p className="text-zinc-400 text-sm">{track.user.full_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {track.duration && (
          <span className="text-zinc-400">
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
    </div>
  )
}
