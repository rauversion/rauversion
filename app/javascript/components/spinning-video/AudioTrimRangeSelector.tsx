import React, { useEffect, useState } from "react"
import AudioRangeSelector from "@/components/shared/AudioRangeSelector"
import { type AudioRange, normalizeAudioRange } from "@/lib/audio-range"

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
  initialStart = 0,
  initialEnd = totalDuration,
  onValueChange,
  isPlaying,
  setIsPlaying,
}: AudioTrimSliderProps) {
  const [value, setValue] = useState<AudioRange>(() => normalizeAudioRange([initialStart, initialEnd], totalDuration))

  useEffect(() => {
    setValue(normalizeAudioRange([initialStart, initialEnd], totalDuration))
  }, [initialStart, initialEnd, totalDuration])

  return (
    <AudioRangeSelector
      totalDuration={totalDuration}
      value={value}
      onValueChange={(start, end) => {
        setValue([start, end])
        onValueChange?.(start, end)
      }}
      isPlaying={isPlaying}
      setIsPlaying={setIsPlaying}
    />
  )
}
