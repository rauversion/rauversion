import { useState, useEffect } from 'react'

export function useAudioPlaying() {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const checkAudioPlaying = () => {
      const audioElement = document.getElementById("audioElement")
      setIsPlaying(audioElement && !audioElement.paused)
    }

    // Check initial state
    checkAudioPlaying()

    // Listen for play and pause events
    const audioElement = document.getElementById("audioElement")
    if (audioElement) {
      audioElement.addEventListener('play', checkAudioPlaying)
      audioElement.addEventListener('pause', checkAudioPlaying)
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('play', checkAudioPlaying)
        audioElement.removeEventListener('pause', checkAudioPlaying)
      }
    }
  }, [])

  return isPlaying
}
