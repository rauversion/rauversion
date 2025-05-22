"use client"

import React, { useRef, useEffect, useState } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DiscProperties } from "./turn-audio-app"

interface AudioPlayerProps {
  properties: DiscProperties
  updateProperty: <K extends keyof DiscProperties>(key: K, value: DiscProperties[K]) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
}

export function AudioPlayer({ properties, updateProperty, isPlaying, setIsPlaying }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Create audio URL when file changes
  useEffect(() => {
    if (properties.audioFile) {
      const url = URL.createObjectURL(properties.audioFile)
      setAudioUrl(url)

      // Clean up the URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setAudioUrl(null)
    }
  }, [properties.audioFile])

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error)
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, setIsPlaying])

  // Update audio time when trim values change
  useEffect(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.currentTime = properties.audioTrim.start
      setCurrentTime(properties.audioTrim.start)
    }
  }, [properties.audioTrim.start, isPlaying])

  // Handle audio events
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration
      setDuration(audioDuration)

      // Update end trim if it's not set or greater than duration
      if (properties.audioTrim.end === 0 || properties.audioTrim.end > audioDuration) {
        updateProperty("audioTrim", { ...properties.audioTrim, end: audioDuration })
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)

      // Stop playback if we reach the end trim point
      if (audioRef.current.currentTime >= properties.audioTrim.end) {
        audioRef.current.pause()
        audioRef.current.currentTime = properties.audioTrim.start
        setIsPlaying(false)
      }
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = properties.audioTrim.start
      setCurrentTime(properties.audioTrim.start)
    }
  }

  return (
    <div className="space-y-2">
      <Label>Audio trim</Label>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
      />

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={duration}
          value={properties.audioTrim.start}
          onChange={(e) => updateProperty("audioTrim", { ...properties.audioTrim, start: Number(e.target.value) })}
          className="w-24"
        />
        <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
          <div
            className="absolute inset-y-0 bg-gray-400 rounded-full"
            style={{
              left: `${duration ? (properties.audioTrim.start / duration) * 100 : 0}%`,
              right: `${duration ? 100 - (properties.audioTrim.end / duration) * 100 : 0}%`,
            }}
          ></div>
          <div
            className="absolute top-1/2 w-3 h-3 bg-black rounded-full -translate-y-1/2"
            style={{
              left: `${duration ? (currentTime / duration) * 100 : 0}%`,
            }}
          ></div>
        </div>
        <Input
          type="number"
          min={0}
          max={duration}
          value={properties.audioTrim.end}
          onChange={(e) => updateProperty("audioTrim", { ...properties.audioTrim, end: Number(e.target.value) })}
          className="w-24"
        />
      </div>
      <div className="flex justify-center gap-4 mt-2">
        <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)} disabled={!audioUrl}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} disabled={!audioUrl}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {audioUrl
          ? "Trim up to 60 seconds. Your video can't be longer than 5 minutes."
          : "Upload an audio file to enable playback."}
      </p>
    </div>
  )
}
