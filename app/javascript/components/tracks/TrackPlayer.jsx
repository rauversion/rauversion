import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { get } from '@rails/request.js'

export default function TrackPlayer({ url, peaks, height = 45, id, urlLink }) {
  const waveformRef = useRef(null)
  const wavesurfer = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

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
      setIsPlaying(true)
    }

    const handleAudioProcessPause = (e) => {
      setIsPlaying(false)
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

  const handlePlay = async () => {
    if (!isPlaying) {
      const event = new CustomEvent("play-song", {
        detail: { id }
      })
      waveformRef.current.dispatchEvent(event)
      
      if (urlLink) {
        const response = await get(urlLink, { 
          responseKind: "turbo-stream"
        })
        console.log("RESPONSE", response)
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
    const eventName = isPlaying ? 'audio-process-pause' : 'audio-process-play'
    const event = new CustomEvent(eventName, {
      detail: { id }
    })
    document.dispatchEvent(event)

    if (!isPlaying) {
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
    setIsPlaying(false)
  }

  return (
    <div className="track-player">
      <div className="controls flex items-center mb-4">
        <button
          onClick={handlePlay}
          className="relative z-0 inline-flex ml-2 pl-6 pt-6 player-button"
        >
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          {isPlaying ? (
            <svg
              className="h-10 w-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ display: isPlaying ? 'none' : 'block' }}
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-10 w-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ display: isPlaying ? 'block' : 'none' }}
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      <div ref={waveformRef} />
    </div>
  )
}
