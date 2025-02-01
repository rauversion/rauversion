import React, { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { get } from '@rails/request.js'
import { Play, Pause } from 'lucide-react'
import useAudioStore from '../../stores/audioStore'

export default function TrackPlayer({ url, peaks, height = 45, id, urlLink, disablePlayButton }) {
  const waveformRef = useRef(null)
  const wavesurfer = useRef(null)
  const { currentTrackId, isPlaying, setCurrentTrack, setIsPlaying, play, pause } = useAudioStore()

  useEffect(() => {
    if (!url) return

    // Initialize WaveSurfer
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      backend: 'MediaElement',
      waveColor: 'grey',
      progressColor: 'white',
      height: height,
      barWidth: 2,
      barGap: 3,
      pixelRatio: 10,
      cursorWidth: 1,
      cursorColor: "lightgray",
      responsive: true,
    })

    wavesurfer.current.load(url, peaks)

    // Event listeners
    wavesurfer.current.on('ready', () => {
      wavesurfer.current.getWrapper().addEventListener('click', handleDrawerClick)
    })

    // Custom event listeners
    const handleAudioProcess = (e) => {
      console.log('Audio process:', e)
    }

    const handleAudioProcessPlay = (e) => {
      if (e.detail.id === id) {
        setIsPlaying(true)
        play(id)
        wavesurfer.current.play()
      }
    }

    const handleAudioProcessPause = (e) => {
      if (e.detail.id === id) {
        setIsPlaying(false)
        pause()
        wavesurfer.current.pause()
      }
    }

    document.addEventListener(`audio-process-${id}`, handleAudioProcess)
    document.addEventListener(`audio-process-${id}-play`, handleAudioProcessPlay)
    document.addEventListener(`audio-process-${id}-pause`, handleAudioProcessPause)
    window.addEventListener('add-from-playlist', handleAddFromPlaylist)

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.getWrapper()?.removeEventListener('click', handleDrawerClick)
        wavesurfer.current.destroy()
      }
      document.removeEventListener(`audio-process-${id}`, handleAudioProcess)
      document.removeEventListener(`audio-process-${id}-play`, handleAudioProcessPlay)
      document.removeEventListener(`audio-process-${id}-pause`, handleAudioProcessPause)
      window.removeEventListener('add-from-playlist', handleAddFromPlaylist)
    }
  }, [url, peaks, height, id])

  useEffect(() => {
    // Handle global playback state changes
    if (currentTrackId === id && isPlaying !== isPlaying) {
      if (isPlaying) {
        wavesurfer.current?.play()
      } else {
        wavesurfer.current?.pause()
      }
    }

    // Pause this track if another track starts playing
    if (currentTrackId !== id && isPlaying) {
      wavesurfer.current?.pause()
    }
  }, [currentTrackId, isPlaying])

  const handlePlay = async () => {
    if (!isPlaying || currentTrackId !== id) {
      // Stop other playing tracks
      if (currentTrackId && currentTrackId !== id) {
        const event = new CustomEvent("audio-process-pause", {
          detail: { id: currentTrackId }
        })
        document.dispatchEvent(event)
      }

      const playPromise = wavesurfer.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setCurrentTrack(id)
            
            if (urlLink) {
              get(urlLink, { 
                responseKind: "turbo-stream"
              }).then(response => {
                console.log("RESPONSE", response)
              });
            }
          })
          .catch((error) => {
            console.error("Playback failed:", error);
            setIsPlaying(false);
          });
      }
    } else {
      dispatchPause()
    }
  }

  const handleAddFromPlaylist = (e) => {
    const event = new CustomEvent("play-song", {
      detail: {
        id: e.detail.track_id
      }
    })
    waveformRef.current.dispatchEvent(event)
  }

  const handleDrawerClick = (e) => {
    const eventName = isPlaying && currentTrackId === id ? 'audio-process-pause' : 'audio-process-play'
    const event = new CustomEvent(eventName, {
      detail: { id }
    })
    document.dispatchEvent(event)

    if (!(isPlaying && currentTrackId === id)) {
      const playEvent = new CustomEvent("play-song", {
        detail: { id }
      })
      waveformRef.current.dispatchEvent(playEvent)
    }
  }

  const dispatchPause = () => {
    const event = new CustomEvent("audio-process-pause", {
      detail: { id }
    })
    document.dispatchEvent(event)
    setIsPlaying(false);
    wavesurfer.current.pause();
  }

  return (
    <div className="track-player">
      {!disablePlayButton && <div className="controls flex items-center mb-4">
        <button
          onClick={handlePlay}
          className="relative z-0 inline-flex ml-2 pl-6 pt-6 player-button"
        >
          <span className="sr-only">{isPlaying && currentTrackId === id ? 'Pause' : 'Play'}</span>
          {isPlaying && currentTrackId === id ? (
            <Pause className="h-10 w-10 text-white" />
          ) : (
            <Play className="h-10 w-10 text-white" />
          )}
        </button>
      </div>}

      <div ref={waveformRef} />
    </div>
  )
}
