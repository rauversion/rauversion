import React, { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudioStore from '../../stores/audioStore'

export default function TrackPlayer({ url, peaks, height = 45, id, urlLink }) {
  const waveformRef = useRef(null)
  const wavesurfer = useRef(null)
  const { currentTrackId, isPlaying } = useAudioStore()

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

    // Handle window resize
    const handleResize = () => {
      if (wavesurfer.current) {
        wavesurfer.current.empty()
        wavesurfer.current.drawBuffer()
      }
    }

    // window.addEventListener('resize', handleResize)

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.getWrapper()?.removeEventListener('click', handleDrawerClick)
        wavesurfer.current.destroy()
      }
      window.removeEventListener('resize', handleResize)
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

  const handleDrawerClick = (e) => {
    const eventName = isPlaying && currentTrackId === id ? 'audio-process-pause' : 'audio-process-play'
    const event = new CustomEvent(eventName, {
      detail: { id }
    })
    document.dispatchEvent(event)
  }

  return (
    <div className="track-player  rounded-lg p-4">
      <div ref={waveformRef} className="w-full" />
    </div>
  )
}
