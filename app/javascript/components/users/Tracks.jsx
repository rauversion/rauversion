import React from 'react'
import { useParams } from 'react-router-dom'
import useAudioStore from '../../stores/audioStore'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import TrackItem from './TrackItem'

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
