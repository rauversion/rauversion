import React, { useState } from "react"
import { DiscPreview } from "./disc-preview"
import { PropertiesPanel } from "./properties-panel"

export type DiscProperties = {
  backgroundColor: string
  discImage: string | null
  discShape: "circle" | "square" | "hexagon"
  discSize: number
  discSpeed: number
  backgroundImage: string | null
  showWatermark: boolean
  audioFile: File | null
  audioTrim: {
    start: number
    end: number
  }
  exportSize: "square" | "portrait" | "landscape"
}

export function TurnAudioApp() {
  const [properties, setProperties] = useState<DiscProperties>({
    backgroundColor: "#faafc8",
    discImage: null,
    discShape: "circle",
    discSize: 75,
    discSpeed: 33, // Default to 33 RPM (standard vinyl record speed)
    backgroundImage: null,
    showWatermark: false,
    audioFile: null,
    audioTrim: {
      start: 0,
      end: 248.57,
    },
    exportSize: "square", // Default to square
  })

  const [isPlaying, setIsPlaying] = useState(false)

  const updateProperty = <K extends keyof DiscProperties>(key: K, value: DiscProperties[K]) => {
    setProperties((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-4">Record spinner video generator</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 flex items-center- justify-center bg-default p-4 rounded-lg min-h-[400px]">
          <DiscPreview properties={properties} isPlaying={isPlaying} />
        </div>
        <div className="w-full md:w-1/2">
          <PropertiesPanel
            properties={properties}
            updateProperty={updateProperty}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>
      </div>
    </div>
  )
}
