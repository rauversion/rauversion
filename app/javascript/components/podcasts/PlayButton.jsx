import React from 'react'
import { Play, Pause } from 'lucide-react'
import useAudioStore from '../../stores/audioStore'

export default function PlayButton({ track }) {

  const { 
    currentTrackId, 
    isPlaying, 
    play,
    pause,
    setPlaylist
  } = useAudioStore()

  const handlePlay = () => {
    if(isPlaying) {
      //audioElement.pause();
      useAudioStore.setState({ isPlaying: false });
    } else {
      // setTracksToStore(0);
      useAudioStore.setState({ currentTrackId: track.id + "", isPlaying: true });
    }
  }

  const isCurrent = () => {
    return currentTrackId === track.id + "";
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="flex items-center gap-2 text-sm font-bold leading-6 text-brand-500 hover:text-brand-700 active:text-brand-900 group"
    >
      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
      <div className="h-10 w-10 rounded-full bg-white/10 ring-1 ring-inset ring-white/20 group-hover:bg-white/20 group-hover:ring-white/30 flex items-center justify-center">
        {isPlaying && isCurrent() ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 translate-x-0.5" />
        )}
      </div>
      <span className="ml-2">{isPlaying && isCurrent() ? 'Pause' : 'Play'}</span>
    </button>
  )
}
