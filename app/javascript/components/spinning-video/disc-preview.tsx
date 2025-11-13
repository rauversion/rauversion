"use client"
import React, { useEffect, useState, useRef } from "react"
import type { DiscProperties } from "./turn-audio-app"

interface DiscPreviewProps {
  properties: DiscProperties
  isPlaying: boolean
}

export function DiscPreview({ properties, isPlaying }: DiscPreviewProps) {
  const [rotation, setRotation] = useState(0)
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  // Calculate degrees per second based on RPM
  // RPM * 360 degrees / 60 seconds = degrees per second
  const degreesPerSecond = properties.discSpeed * 6

  // Animation loop using requestAnimationFrame for smooth continuous rotation
  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      // Calculate how much to rotate based on time passed and speed
      const deltaRotation = (degreesPerSecond * deltaTime) / 1000

      // Update rotation and ensure it stays within 0-360 for better performance
      setRotation((prevRotation) => (prevRotation + deltaRotation) % 360)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  // Start or stop the animation based on isPlaying
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate)
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [isPlaying])

  // Reset animation when speed changes to ensure it takes effect immediately
  useEffect(() => {
    if (isPlaying && requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = requestAnimationFrame(animate)
    }
  }, [properties.discSpeed])

  // Placeholder disc image if none is provided
  const discImageUrl = properties.discImage || "/abstract-colorful-swirls.png"

  // Determine container class based on export size
  const containerClasses = {
    square: "aspect-square h-full w-full",
    portrait: "aspect-[9/16] h-full",
    landscape: "aspect-[16/9] w-full",
  }

  return (
    <div
      className={`h-auto md:max-h-[50vw] md:h-2/3 w-full md:w-auto border border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center ${containerClasses[properties.exportSize]}`}
    >
      <div
        id="preview"
        className={`flex h-full items-center justify-center w-full ${containerClasses[properties.exportSize]}`}
      >
        <div
          id="background"
          className="bg-center bg-cover border border-neutral-200 dark:border-neutral-700 flex items-center justify-center relative rounded-lg md:rounded-2xl w-full h-full"
          style={{
            backgroundColor: properties.backgroundColor,
            backgroundImage: properties.backgroundImage ? `url(${properties.backgroundImage})` : "none",
          }}
        >
          <div
            className="relative"
            style={{
              width: `${properties.discSize}%`,
              paddingBottom: `${properties.discSize}%`,
            }}
          >
            <div
              id="disc"
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                backgroundImage: `url(${discImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>

          {properties.showWatermark && (
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">turn.audio</div>
          )}
        </div>
      </div>
    </div>
  )
}
