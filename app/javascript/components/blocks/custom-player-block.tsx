"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import type { CustomPlayerBlock as CustomPlayerBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface CustomPlayerBlockProps {
  block: CustomPlayerBlockType
  isEditing?: boolean
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function CustomPlayerBlock({ block, isEditing }: CustomPlayerBlockProps) {
  const { tracks, artwork, accentColor } = block.props
  const audioRef = useRef<HTMLAudioElement>(null)

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  const currentTrack = tracks[currentTrackIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex((i) => i + 1)
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentTrackIndex, tracks.length])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  useEffect(() => {
    if (audioRef.current && currentTrack?.audioUrl) {
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play()
      }
    }
  }, [currentTrackIndex])

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack?.audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0
    } else if (currentTrackIndex > 0) {
      setCurrentTrackIndex((i) => i - 1)
    }
  }

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex((i) => i + 1)
    }
  }

  if (!tracks.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/25 rounded-lg p-8",
          "min-h-[200px]"
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Play className="h-8 w-8" />
          {isEditing && <span className="text-sm">Añade tracks al player</span>}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden bg-card border"
      style={{ "--player-accent": accentColor } as React.CSSProperties}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={currentTrack?.audioUrl} preload="metadata" />

      <div className="flex flex-col sm:flex-row">
        {/* Artwork */}
        <div className="sm:w-48 sm:h-48 aspect-square flex-shrink-0">
          {artwork || currentTrack?.artworkUrl ? (
            <img
              src={artwork || currentTrack?.artworkUrl}
              alt="Album artwork"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg truncate">
              {currentTrack?.title || "Untitled Track"}
            </h3>
            <p className="text-muted-foreground text-sm truncate">
              {currentTrack?.artist || "Unknown Artist"}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2 my-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                disabled={isEditing}
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={togglePlay}
                className="p-3 rounded-full transition-colors"
                style={{ backgroundColor: accentColor, color: "white" }}
                disabled={isEditing || !currentTrack?.audioUrl}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                disabled={isEditing}
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(v) => {
                  setVolume(v[0])
                  setIsMuted(false)
                }}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      {tracks.length > 1 && (
        <div className="border-t max-h-40 overflow-y-auto">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => setCurrentTrackIndex(index)}
              className={cn(
                "w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                index === currentTrackIndex && "bg-muted"
              )}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor:
                    index === currentTrackIndex ? accentColor : "transparent",
                  color: index === currentTrackIndex ? "white" : "inherit",
                }}
              >
                {index === currentTrackIndex && isPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{track.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {track.artist}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(track.duration)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
