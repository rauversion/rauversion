"use client"

import React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, RotateCcw, RotateCw, Timer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AudioTrimSliderProps {
  totalDuration?: number
  initialStart?: number
  initialEnd?: number
  onValueChange?: (start: number, end: number) => void
  isPlaying?: boolean
  setIsPlaying?: (playing: boolean) => void
}

export default function AudioTrimSlider({
  totalDuration = 300,
  initialStart = 86.2,
  initialEnd = 192.74,
  onValueChange,
  isPlaying,
  setIsPlaying
}: AudioTrimSliderProps) {
  const [startTime, setStartTime] = useState(initialStart)
  const [endTime, setEndTime] = useState(initialEnd)
  const [isDragging, setIsDragging] = useState<"start" | "end" | "center" | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const sliderRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const getPercentage = (value: number) => (value / totalDuration) * 100
  const getValueFromPercentage = (percentage: number) => (percentage / 100) * totalDuration

  const handleMouseDown = useCallback(
    (type: "start" | "end" | "center", e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(type)

      if (type === "center" && trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect()
        const centerX =
          rect.left +
          (getPercentage(startTime) / 100) * rect.width +
          (((getPercentage(endTime) - getPercentage(startTime)) / 100) * rect.width) / 2
        setDragOffset(e.clientX - centerX)
      }
    },
    [startTime, endTime],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      const value = getValueFromPercentage(percentage)

      if (isDragging === "start") {
        const newStart = Math.max(0, Math.min(value, endTime - 1))
        setStartTime(newStart)
        onValueChange?.(newStart, endTime)
      } else if (isDragging === "end") {
        const newEnd = Math.max(startTime + 1, Math.min(value, totalDuration))
        setEndTime(newEnd)
        onValueChange?.(startTime, newEnd)
      } else if (isDragging === "center") {
        const centerX = e.clientX - dragOffset - rect.left
        const centerPercentage = (centerX / rect.width) * 100
        const centerValue = getValueFromPercentage(centerPercentage)

        const duration = endTime - startTime
        const halfDuration = duration / 2

        let newStart = centerValue - halfDuration
        let newEnd = centerValue + halfDuration

        // Constrain to bounds
        if (newStart < 0) {
          newStart = 0
          newEnd = duration
        } else if (newEnd > totalDuration) {
          newEnd = totalDuration
          newStart = totalDuration - duration
        }

        setStartTime(newStart)
        setEndTime(newEnd)
        onValueChange?.(newStart, newEnd)
      }
    },
    [isDragging, dragOffset, startTime, endTime, totalDuration, onValueChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    setDragOffset(0)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const formatTime = (seconds: number) => {
    return seconds.toFixed(1)
  }

  const resetToMaximum = () => {
    setStartTime(0)
    setEndTime(totalDuration)
    onValueChange?.(0, totalDuration)
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900 rounded-lg text-white">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Audio trim</h2>

      {/* Slider Track */}
      <div ref={sliderRef} className="relative mb-6 h-12 bg-gray-700 rounded cursor-pointer">
        <div ref={trackRef} className="absolute inset-0 rounded">
          {/* Selection Area */}
          <div
            className="absolute top-0 bottom-0 bg-cyan-400/30 border-l-2 border-r-2 border-cyan-400 rounded-sm"
            style={{
              left: `${getPercentage(startTime)}%`,
              width: `${getPercentage(endTime) - getPercentage(startTime)}%`,
            }}
          >
            {/* Center Handle with Dots */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 cursor-grab active:cursor-grabbing flex items-center justify-center"
              onMouseDown={(e) => handleMouseDown("center", e)}
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Start Handle */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-cyan-400 cursor-ew-resize rounded-l"
            style={{ left: `${getPercentage(startTime)}%` }}
            onMouseDown={(e) => handleMouseDown("start", e)}
          />

          {/* End Handle */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-cyan-400 cursor-ew-resize rounded-r"
            style={{ left: `${getPercentage(endTime)}%` }}
            onMouseDown={(e) => handleMouseDown("end", e)}
          />
        </div>
      </div>

      {/* Time Inputs */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="number"
            value={formatTime(startTime)}
            onChange={(e) => {
              const value = Number.parseFloat(e.target.value) || 0
              const newStart = Math.max(0, Math.min(value, endTime - 1))
              setStartTime(newStart)
              onValueChange?.(newStart, endTime)
            }}
            className="bg-gray-800 border-gray-600 text-white text-center"
            step="0.1"
          />
        </div>
        <div className="flex-1">
          <Input
            type="number"
            value={formatTime(endTime)}
            onChange={(e) => {
              const value = Number.parseFloat(e.target.value) || 0
              const newEnd = Math.max(startTime + 1, Math.min(value, totalDuration))
              setEndTime(newEnd)
              onValueChange?.(startTime, newEnd)
            }}
            className="bg-gray-800 border-gray-600 text-white text-center"
            step="0.1"
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          size="sm"
          variant="outline"
          className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          onClick={() => setIsPlaying?.(!isPlaying)}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button size="sm" variant="outline" className="bg-gray-800 border-gray-600 hover:bg-gray-700">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" className="bg-gray-800 border-gray-600 hover:bg-gray-700">
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" className="bg-gray-800 border-gray-600 hover:bg-gray-700">
          <Timer className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          onClick={resetToMaximum}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
