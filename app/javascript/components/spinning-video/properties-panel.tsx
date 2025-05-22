"use client"

import React, { type ChangeEvent, useState } from "react"
import { useForm } from "react-hook-form"
import { post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"
import { AudioPlayer } from "./audio-player"
import type { DiscProperties } from "./turn-audio-app"

interface PropertiesPanelProps {
  properties: DiscProperties
  updateProperty: <K extends keyof DiscProperties>(key: K, value: DiscProperties[K]) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
}

export function PropertiesPanel({ properties, updateProperty, isPlaying, setIsPlaying }: PropertiesPanelProps) {
  const [discImageName, setDiscImageName] = useState<string>("")
  const [backgroundImageName, setBackgroundImageName] = useState<string>("")
  const [discImageFile, setDiscImageFile] = useState<File | null>(null)
  const { toast } = useToast()
  const { register, handleSubmit, setValue, getValues } = useForm()

  // Helper to send data as FormData to backend
  const onExport = async () => {
    const formData = new FormData()
    // Cover image: send as File if available
    if (discImageFile) {
      formData.append("cover_image", discImageFile)
    } else if (properties.discImage) {
      // fallback: send as data URL string (legacy/edge case)
      formData.append("cover_image", properties.discImage)
    }
    // Audio file
    if (properties.audioFile) {
      formData.append("audio_file", properties.audioFile)
    }
    // Video options
    formData.append("duration", String((properties.audioTrim?.end ?? 5) - (properties.audioTrim?.start ?? 0)))
    formData.append("loop_speed", String(properties.discSpeed || 1))
    formData.append("audio_start", String(properties.audioTrim?.start ?? 0))
    formData.append("audio_end", String(properties.audioTrim?.end ?? 0))
    formData.append("bg_color", String(properties.backgroundColor ?? "#000000"))
    //formData.append("bg_image", properties.backgroundImage || "")
    //formData.append("watermark", String(properties.showWatermark))
    //formData.append("disc_shape", properties.discShape || "circle")
    formData.append("disc_size", String(properties.discSize || 75))
    // Add more fields as needed (format, exportSize, etc.)

    try {
      const response = await fetch("/turn/generate_video.json", {
        method: "POST",
        body: formData,
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
        },
      })
      if (response.ok) {
        const data = await response.json()
        toast({ title: "Video generated!", description: <a href={data.url} target="_blank" rel="noopener noreferrer">Download Video</a> })
      } else {
        toast({ title: "Error", description: "Failed to generate video", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate video", variant: "destructive" })
    }
  }

  const handleDiscImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDiscImageName(file.name)
      setDiscImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          updateProperty("discImage", event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackgroundImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBackgroundImageName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          updateProperty("backgroundImage", event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateProperty("audioFile", file)
      // Reset play state when new audio is loaded
      setIsPlaying(false)
    }
  }

  const clearDiscImage = () => {
    setDiscImageName("")
    setDiscImageFile(null)
    updateProperty("discImage", null)
  }

  const clearBackgroundImage = () => {
    setBackgroundImageName("")
    updateProperty("backgroundImage", null)
  }

  const clearAudioFile = () => {
    updateProperty("audioFile", null)
    setIsPlaying(false)
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div>
        <h2 className="text-lg font-semibold mb-4">Customize Your Disc</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disc-image">Disc image *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="disc-image-display"
                value={discImageName}
                readOnly
                placeholder="No file chosen"
                className="flex-1"
              />
              <div className="relative">
                <Input
                  id="disc-image"
                  type="file"
                  accept="image/*"
                  onChange={handleDiscImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  Browse
                </Button>
              </div>
              {discImageName && (
                <Button variant="ghost" size="sm" onClick={clearDiscImage}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">This image will turn in your video.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disc-design">Disc design</Label>
            <Select
              value={properties.discShape}
              onValueChange={(value) => updateProperty("discShape", value as "circle" | "square" | "hexagon")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="hexagon">Hexagon</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This control may change the disc into other designs like vinyl.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disc-shape">Disc shape</Label>
            <Select value="circle" disabled>
              <SelectTrigger>
                <SelectValue placeholder="Circle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This control may change the shape of the disc.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disc-size">Disc size</Label>
            <div className="pt-2">
              <Slider
                id="disc-size"
                min={20}
                max={100}
                step={1}
                value={[properties.discSize]}
                onValueChange={(value) => updateProperty("discSize", value[0])}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>20</span>
              <span>60</span>
              <span>100</span>
            </div>
            <p className="text-xs text-muted-foreground">This control may change the size of the disc.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="disc-speed">Disc speed</Label>
              <div className="bg-black text-white text-xs px-2 py-0.5 rounded">PRO</div>
            </div>
            <div className="pt-2">
              <Slider
                id="disc-speed"
                min={1}
                max={78}
                step={1}
                value={[properties.discSpeed]}
                onValueChange={(value) => updateProperty("discSpeed", value[0])}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>5</span>
              <span>33</span>
              <span>45</span>
              <span>78</span>
            </div>
            <p className="text-xs text-muted-foreground">Pro users may adjust the rotations per minute.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background-color">Background color *</Label>
            <div className="flex gap-2">
              <Input
                id="background-color"
                type="color"
                value={properties.backgroundColor}
                onChange={(e) => updateProperty("backgroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={properties.backgroundColor}
                onChange={(e) => updateProperty("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Select color or enter a valid color code.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background-image">Background image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="background-image-display"
                value={backgroundImageName}
                readOnly
                placeholder="No file chosen"
                className="flex-1"
              />
              <div className="relative">
                <Input
                  id="background-image"
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  Browse
                </Button>
              </div>
              {backgroundImageName && (
                <Button variant="ghost" size="sm" onClick={clearBackgroundImage}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">This control may replace the background with an image.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="watermark">Watermark</Label>
              <Switch
                id="watermark"
                checked={properties.showWatermark}
                onCheckedChange={(checked) => updateProperty("showWatermark", checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">This control may remove the Turn watermark.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio-file">Audio file</Label>
            <div className="flex items-center gap-2">
              <Input
                id="audio-file-display"
                value={properties.audioFile?.name || ""}
                readOnly
                placeholder="No file chosen"
                className="flex-1"
              />
              <div className="relative">
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  Browse
                </Button>
              </div>
              {properties.audioFile && (
                <Button variant="ghost" size="sm" onClick={clearAudioFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Select your audio file and then trim it.</p>
          </div>

          <AudioPlayer
            properties={properties}
            updateProperty={updateProperty}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />

          <div className="space-y-2">
            <Label htmlFor="export-size">Export size</Label>
            <Select
              value={properties.exportSize}
              onValueChange={(value) => updateProperty("exportSize", value as "square" | "portrait" | "landscape")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Square" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This control may export in story and landscape sizes.</p>
          </div>

          <div className="pt-4">
            <Button className="w-full" type="button" onClick={onExport}>Export Video</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
