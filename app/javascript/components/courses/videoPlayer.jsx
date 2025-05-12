"use client"

import React, { useState, useEffect, useRef } from "react"

export default function VideoPlayer({ videoUrl, isPlaying, setIsPlaying, onProgressUpdate }) {
  const videoRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100) // Default duration in seconds
  const animationRef = useRef(null)

  // Simulate video playback with animation frame
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    let lastTimestamp = null

    const updateTime = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp
      }

      // Calculate time difference in seconds
      const delta = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp

      // Update current time
      setCurrentTime((prevTime) => {
        const newTime = Math.min(prevTime + delta, duration)
        return newTime
      })

      // Continue animation if still playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateTime)
      }
    }

    animationRef.current = requestAnimationFrame(updateTime)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, duration])

  // Call onProgressUpdate and handle end-of-video logic in effect
  useEffect(() => {
    const progress = (currentTime / duration) * 100
    if (onProgressUpdate) onProgressUpdate(progress)
    if (isPlaying && currentTime >= duration) {
      setIsPlaying(false)
    }
  }, [currentTime, duration, isPlaying, onProgressUpdate, setIsPlaying])

  // Handle video loading
  const handleVideoLoaded = () => {
    setIsLoaded(true)
    // Set a mock duration based on the lesson duration (for demo purposes)
    // In a real implementation, this would come from the video element
    setDuration(100) // 100 seconds for demo
  }

  // Handle click on video to toggle play/pause
  const handleVideoClick = () => {
    setIsPlaying(!isPlaying)
  }

  // Format time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* For demo purposes, we're using an image as a placeholder since we can't actually play videos */}
      {/*<img
        ref={videoRef}
        src={videoUrl || "/placeholder.svg"}
        alt="Video lesson"
        className="w-full h-full object-contain cursor-pointer"
        onLoad={handleVideoLoaded}
        onClick={handleVideoClick}
      />*/}

      {/* This would be the actual video element in a real implementation */}

      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onLoadedData={handleVideoLoaded}
        controls
        onClick={() => setIsPlaying(!isPlaying)}
      />

    </div>
  )
}
