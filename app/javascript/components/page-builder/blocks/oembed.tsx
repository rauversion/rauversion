"use client"
import React, { useState, useEffect } from "react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { get } from "@rails/request.js"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export const oembedBlock: BlockDefinition = {
  type: "oembed",
  label: "oEmbed",
  icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  defaultProperties: {
    url: "",
    aspectRatio: "16:9",
  },

  render: ({ block }: BlockRendererProps) => {
    const { url, aspectRatio } = block.properties
    const [embedData, setEmbedData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      if (!url) return

      let cancelled = false
      setLoading(true)
      setError(null)

      get(`/oembed?url=${encodeURIComponent(url)}`)
        .then(response => {
          if (!response.ok) throw new Error("Failed to fetch oEmbed data")
          return response.json
        })
        .then(data => {
          if (!cancelled) setEmbedData(data)
        })
        .catch(err => {
          if (!cancelled) setError("Failed to fetch embed data")
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => { cancelled = true }
    }, [url])

    const getAspectRatioClass = () => {
      switch (aspectRatio) {
        case "1:1": return "aspect-square"
        case "4:3": return "aspect-[4/3]"
        case "16:9": return "aspect-video"
        case "21:9": return "aspect-[21/9]"
        default: return "aspect-video"
      }
    }

    if (loading) {
      return <div className={cn("animate-pulse bg-gray-200", getAspectRatioClass())} />
    }

    if (error) {
      return <div className="bg-red-50 text-red-500 p-4 rounded">{error}</div>
    }

    if (!embedData) {
      return <div className="bg-gray-50 p-4 rounded">Please enter a valid oEmbed URL</div>
    }

    return (
      <div className="w-full">
        <div className={cn("relative w-full", getAspectRatioClass())}>
          <div
            className="absolute inset-0"
            dangerouslySetInnerHTML={{ __html: embedData.html }}
          />
        </div>
        {embedData.title && (
          <div className="mt-2 text-sm text-gray-600">{embedData.title}</div>
        )}
      </div>
    )
  },

  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="oembed-url">Embed URL</Label>
        <Input
          id="oembed-url"
          value={properties.url || ""}
          onChange={e => onChange("url", e.target.value)}
          placeholder="Paste a YouTube, Twitter, or other oEmbed URL"
        />
      </div>
      <div>
        <Label htmlFor="oembed-aspect">Aspect Ratio</Label>
        <Select
          value={properties.aspectRatio || "16:9"}
          onValueChange={value => onChange("aspectRatio", value)}
        >
          <SelectTrigger id="oembed-aspect">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
}
