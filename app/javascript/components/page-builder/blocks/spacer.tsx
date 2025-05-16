"use client"
import React from "react"

import { ArrowUpDown } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export const spacerBlock: BlockDefinition = {
  type: "spacer",
  label: "Spacer",
  icon: <ArrowUpDown size={16} />,
  defaultProperties: {
    height: 40,
  },
  render: ({ block, isSelected, onSelect }: BlockRendererProps) => {
    const { height } = block.properties

    return (
      <div
        className="w-full"
        style={{ height: `${height || 40}px` }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      />
    )
  },
  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="spacer-height">Height (px)</Label>
            <span className="text-sm text-muted-foreground">{properties.height || 40}px</span>
          </div>
          <Slider
            id="spacer-height"
            min={4}
            max={200}
            step={4}
            value={[properties.height || 40]}
            onValueChange={([value]) => onChange("height", value)}
          />
        </div>
      </div>
    )
  },
}
