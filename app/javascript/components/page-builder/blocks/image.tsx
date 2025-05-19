"use client"
import React from "react"

import { ImageIcon } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export const imageBlock: BlockDefinition = {
  type: "image",
  label: "Image",
  icon: <ImageIcon size={16} />,
  defaultProperties: {
    src: "/placeholder-image.png",
    alt: "Image description",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: 0,
  },
  render: ({ block, isSelected, onSelect }: BlockRendererProps) => {
    const { src, alt, width, height, objectFit, borderRadius } = block.properties

    return (
      <div
        className="w-full"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={cn("block")}
          style={{
            width: width || "100%",
            height: height || "auto",
            objectFit: objectFit || "cover",
            borderRadius: `${borderRadius || 0}px`,
          }} 
        />
      </div>
    )
  },
  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-src">Image</Label>
          <div className="flex flex-col gap-2">
            {properties.src && (
              <div className="relative w-full h-32">
                <img src={properties.src} alt="Preview" className="w-full h-full object-cover rounded" />
                <button
                  type="button"
                  onClick={() => onChange("src", "")}
                  className="absolute top-1 right-1 bg-white/80 rounded-full px-2 py-1 text-xs text-red-500 hover:bg-white"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Upload
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append("file", file)
                    try {
                      // @ts-ignore
                      const { post } = await import("@rails/request.js")
                      const response = await post("/releases/upload_puck_image.json", {
                        body: formData,
                        responseKind: "json",
                        contentType: false
                      })
                      // @ts-ignore
                      const data = await response.json
                      if (data && data.url) {
                        onChange("src", data.url)
                      }
                    } catch (error) {
                      // eslint-disable-next-line no-console
                      console.error("Upload failed:", error)
                    }
                  }}
                />
              </label>
              <Input
                id="image-src"
                value={properties.src || ""}
                onChange={(e) => onChange("src", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-64"
              />
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="image-alt">Alt Text</Label>
          <Input
            id="image-alt"
            value={properties.alt || ""}
            onChange={(e) => onChange("alt", e.target.value)}
            placeholder="Description of the image"
          />
        </div>
        <div>
          <Label htmlFor="image-width">Width</Label>
          <Input
            id="image-width"
            value={properties.width || "100%"}
            onChange={(e) => onChange("width", e.target.value)}
            placeholder="100%, 300px, etc."
          />
        </div>
        <div>
          <Label htmlFor="image-height">Height</Label>
          <Input
            id="image-height"
            value={properties.height || "auto"}
            onChange={(e) => onChange("height", e.target.value)}
            placeholder="auto, 200px, etc."
          />
        </div>
        <div>
          <Label htmlFor="image-object-fit">Object Fit</Label>
          <Select value={properties.objectFit || "cover"} onValueChange={(value) => onChange("objectFit", value)}>
            <SelectTrigger id="image-object-fit">
              <SelectValue placeholder="Select object fit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="fill">Fill</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="scale-down">Scale Down</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="image-border-radius">Border Radius (px)</Label>
            <span className="text-sm text-muted-foreground">{properties.borderRadius || 0}px</span>
          </div>
          <Slider
            id="image-border-radius"
            min={0}
            max={50}
            step={1}
            value={[properties.borderRadius || 0]}
            onValueChange={([value]) => onChange("borderRadius", value)}
          />
        </div>
      </div>
    )
  },
}
