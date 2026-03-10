import React from 'react'
import { Play, Pause } from 'lucide-react'
import useAudioStore from '../../stores/audioStore'

export default function PlayButton({ track }) {
  const { currentTrackId, isPlaying } = useAudioStore()

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
      className="group inline-flex items-center gap-3 text-sm font-bold leading-6 text-default transition-colors hover:text-default/80"
    >
      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white ring-1 ring-inset ring-black/10 transition-all group-hover:scale-[1.02] group-hover:bg-black/85 dark:bg-white dark:text-black dark:ring-white/20 dark:group-hover:bg-white/85">
        {isPlaying && isCurrent() ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 translate-x-0.5" />
        )}
      </div>
      <span>{isPlaying && isCurrent() ? 'Pause' : 'Play'}</span>
    </button>
  )
}
