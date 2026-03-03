import React, { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudioStore from '../../stores/audioStore'

export default function TrackPlayer({ url, peaks, height = 45, id }) {
  const waveformRef = useRef(null)
  const wavesurfer = useRef(null)
  const isCurrentTrackRef = useRef(false)
  const isWaveReadyRef = useRef(false)
  const currentTrackId = useAudioStore((state) => state.currentTrackId)
  const trackId = `${id}`
  const isCurrentTrack = currentTrackId !== null && `${currentTrackId}` === trackId

  const getWaveDuration = () => {
    const duration = wavesurfer.current?.getDuration()
    return Number.isFinite(duration) && duration > 0 ? duration : null
  }

  useEffect(() => {
    isCurrentTrackRef.current = isCurrentTrack
  }, [isCurrentTrack])

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
      interact: false,
    })

    wavesurfer.current.load(url, peaks)

    const handleWaveformClick = (event) => {
      if (!wavesurfer.current || !isCurrentTrackRef.current || !isWaveReadyRef.current) return

      const rect = event.currentTarget.getBoundingClientRect()
      if (!rect.width) return

      const duration = getWaveDuration()
      if (!duration) return

      const rawPercent = (event.clientX - rect.left) / rect.width
      const percent = Math.min(Math.max(rawPercent, 0), 1)
      const position = duration * percent

      try {
        wavesurfer.current.seekTo(percent)
      } catch (error) {
        console.error('Waveform seek failed:', error)
        return
      }

      const seekEvent = new CustomEvent(`audio-process-mouseup-${trackId}`, {
        detail: {
          trackId: id,
          position,
          percent
        }
      })

      document.dispatchEvent(seekEvent)
    }

    // Event listeners
    wavesurfer.current.on('ready', () => {
      isWaveReadyRef.current = true
      wavesurfer.current.getWrapper()?.addEventListener('click', handleWaveformClick)
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
      isWaveReadyRef.current = false
      if (wavesurfer.current) {
        wavesurfer.current.getWrapper()?.removeEventListener('click', handleWaveformClick)
        wavesurfer.current.destroy()
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [url, peaks, height, id, trackId])

  useEffect(() => {
    if (!wavesurfer.current || isCurrentTrack || !isWaveReadyRef.current) return

    // Reset non-active waveforms so only the current track shows progress.
    const duration = getWaveDuration()
    if (!duration) return

    try {
      wavesurfer.current.seekTo(0)
    } catch (error) {
      console.error('Waveform reset failed:', error)
    }
  }, [isCurrentTrack])

  useEffect(() => {
    const handleAudioProgress = (event) => {
      const { percent } = event.detail || {}
      if (!wavesurfer.current || !isWaveReadyRef.current || typeof percent !== 'number' || !Number.isFinite(percent)) return

      const duration = getWaveDuration()
      if (!duration) return

      const clampedPercent = Math.min(Math.max(percent, 0), 1)
      try {
        wavesurfer.current.seekTo(clampedPercent)
      } catch (error) {
        console.error('Waveform progress sync failed:', error)
      }
    }

    document.addEventListener(`audio-process-${trackId}`, handleAudioProgress)

    return () => {
      document.removeEventListener(`audio-process-${trackId}`, handleAudioProgress)
    }
  }, [trackId])

  return (
    <div className="track-player  rounded-lg p-4">
      <div ref={waveformRef} className="w-full" />
    </div>
  )
}
