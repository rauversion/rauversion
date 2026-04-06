"use client"

import React from "react"
import type { VideoBackgroundBlock as VideoBackgroundBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { useState, useRef } from "react"

interface VideoBackgroundBlockProps {
  block: VideoBackgroundBlockType
  isEditing?: boolean
}

export function VideoBackgroundBlock({ block, isEditing }: VideoBackgroundBlockProps) {
  const { 
    variant, 
    videoUrl, 
    posterImage, 
    title, 
    subtitle, 
    overlayOpacity, 
    overlayColor,
    height,
    autoplay,
    loop,
    muted: initialMuted
  } = block.props

  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [isMuted, setIsMuted] = useState(initialMuted)
  const videoRef = useRef<HTMLVideoElement>(null)

  const heightClasses = {
    screen: "min-h-screen",
    large: "min-h-[600px]",
    medium: "min-h-[400px]",
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const renderContent = () => (
    <div className={cn(
      "relative z-10 flex flex-col items-center justify-center text-center text-white px-6",
      variant === "split" ? "items-start text-left w-1/2" : ""
    )}>
      {title && (
        <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-xl md:text-2xl text-white/80 drop-shadow-md max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  )

  const renderControls = () => (
    <div className="absolute bottom-6 right-6 z-20 flex gap-2">
      <button
        onClick={togglePlay}
        className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <button
        onClick={toggleMute}
        className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  )

  if (!videoUrl && isEditing) {
    return (
      <div className={cn(
        "relative flex items-center justify-center bg-muted/50 border-2 border-dashed border-border rounded-lg",
        heightClasses[height]
      )}>
        <div className="text-center text-muted-foreground">
          <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Agrega una URL de video</p>
          <p className="text-xs mt-1">Soporta MP4, WebM</p>
        </div>
      </div>
    )
  }

  switch (variant) {
    case "fullscreen":
      return (
        <div className={cn("relative overflow-hidden", heightClasses[height])}>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterImage}
            autoPlay={autoplay && !isEditing}
            loop={loop}
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: overlayColor,
              opacity: overlayOpacity / 100 
            }}
          />
          {renderContent()}
          {!isEditing && renderControls()}
        </div>
      )

    case "contained":
      return (
        <div className="relative rounded-xl overflow-hidden">
          <div className={cn("relative", heightClasses[height])}>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterImage}
              autoPlay={autoplay && !isEditing}
              loop={loop}
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: overlayColor,
                opacity: overlayOpacity / 100 
              }}
            />
            {renderContent()}
            {!isEditing && renderControls()}
          </div>
        </div>
      )

    case "parallax":
      return (
        <div className={cn("relative overflow-hidden", heightClasses[height])}>
          <div className="absolute inset-0 scale-110">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterImage}
              autoPlay={autoplay && !isEditing}
              loop={loop}
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "translateY(var(--parallax-offset, 0))" }}
            />
          </div>
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: overlayColor,
              opacity: overlayOpacity / 100 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          {renderContent()}
          {!isEditing && renderControls()}
        </div>
      )

    case "split":
      return (
        <div className={cn("relative flex overflow-hidden", heightClasses[height])}>
          <div className="w-1/2 relative flex items-center justify-center bg-background p-12">
            <div className="max-w-md">
              {title && (
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="w-1/2 relative">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterImage}
              autoPlay={autoplay && !isEditing}
              loop={loop}
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: overlayColor,
                opacity: overlayOpacity / 100 
              }}
            />
            {!isEditing && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {renderControls()}
              </div>
            )}
          </div>
        </div>
      )

    default:
      return null
  }
}
