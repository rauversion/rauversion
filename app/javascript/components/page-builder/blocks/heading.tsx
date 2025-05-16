"use client"
import React from "react"

import { Heading1 } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChromePicker } from "react-color"
import * as Popover from "@radix-ui/react-popover"

export const headingBlock: BlockDefinition = {
  type: "heading",
  label: "Heading",
  icon: <Heading1 size={16} />,
  defaultProperties: {
    text: "Heading",
    level: "h2",
    align: "left",
    color: "",
    fontFamily: "inherit",
    textStretch: "normal",
  },
  render: ({ block, isSelected, onSelect }: BlockRendererProps) => {
    const { text, level, align, color, fontFamily, textStretch } = block.properties

    const headingClasses = cn(
      "w-full",
      align === "center" && "text-center",
      align === "right" && "text-right"
    )

    // Map textStretch to CSS font-stretch values
    const fontStretchMap: Record<string, string> = {
      normal: "normal",
      expanded: "expanded",
      condensed: "condensed",
      ultraExpanded: "ultra-expanded",
      extraExpanded: "extra-expanded",
      semiExpanded: "semi-expanded",
      semiCondensed: "semi-condensed",
      extraCondensed: "extra-condensed",
      ultraCondensed: "ultra-condensed",
    }

    const renderHeading = () => {
      const style = {
        color: color || "inherit",
        fontFamily: fontFamily || "inherit",
        fontStretch: fontStretchMap[textStretch] || "normal",
      }

      switch (level) {
        case "h1":
          return (
            <h1 className={cn(headingClasses, "text-4xl font-bold")} style={style}>
              {text}
            </h1>
          )
        case "h2":
          return (
            <h2 className={cn(headingClasses, "text-3xl font-bold")} style={style}>
              {text}
            </h2>
          )
        case "h3":
          return (
            <h3 className={cn(headingClasses, "text-2xl font-bold")} style={style}>
              {text}
            </h3>
          )
        case "h4":
          return (
            <h4 className={cn(headingClasses, "text-xl font-bold")} style={style}>
              {text}
            </h4>
          )
        case "h5":
          return (
            <h5 className={cn(headingClasses, "text-lg font-bold")} style={style}>
              {text}
            </h5>
          )
        case "h6":
          return (
            <h6 className={cn(headingClasses, "text-base font-bold")} style={style}>
              {text}
            </h6>
          )
        default:
          return (
            <h2 className={cn(headingClasses, "text-3xl font-bold")} style={style}>
              {text}
            </h2>
          )
      }
    }

    return (
      <div
        className="w-full"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {renderHeading()}
      </div>
    )
  },
  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="heading-text">Text</Label>
          <Input id="heading-text" value={properties.text || ""} onChange={(e) => onChange("text", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="heading-level">Level</Label>
          <Select value={properties.level || "h2"} onValueChange={(value) => onChange("level", value)}>
            <SelectTrigger id="heading-level">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
              <SelectItem value="h4">H4</SelectItem>
              <SelectItem value="h5">H5</SelectItem>
              <SelectItem value="h6">H6</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="heading-align">Alignment</Label>
          <Select value={properties.align || "left"} onValueChange={(value) => onChange("align", value)}>
            <SelectTrigger id="heading-align">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="heading-color">Color</Label>
          <div className="flex items-center gap-4">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label="Pick color"
                  className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                  style={{
                    background: properties.color || "transparent",
                  }}
                />
              </Popover.Trigger>
              <Popover.Content
                side="right"
                align="start"
                className="z-50 bg-white rounded shadow-lg p-2"
                sideOffset={8}
              >
                <ChromePicker
                  color={properties.color || "#000"}
                  onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                    // Prefer rgba if alpha < 1, else hex
                    const { r, g, b, a } = color.rgb
                    const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                    onChange("color", value)
                  }}
                  styles={{
                    default: {
                      picker: {
                        width: "180px",
                        boxShadow: "none",
                      },
                    },
                  }}
                />
              </Popover.Content>
            </Popover.Root>
            <Input
              id="heading-color"
              type="text"
              value={properties.color || ""}
              onChange={(e) => onChange("color", e.target.value)}
              placeholder="#000000, rgb(0,0,0), rgba(0,0,0,0.5), etc."
              className="w-36"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="heading-font-family">Font Family</Label>
          <Select
            value={properties.fontFamily || "inherit"}
            onValueChange={(value) => onChange("fontFamily", value)}
          >
            <SelectTrigger id="heading-font-family">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              <SelectItem value="sans-serif">Sans Serif</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
              <SelectItem value="system-ui">System UI</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="heading-text-stretch">Text Stretch</Label>
          <Select
            value={properties.textStretch || "normal"}
            onValueChange={(value) => onChange("textStretch", value)}
          >
            <SelectTrigger id="heading-text-stretch">
              <SelectValue placeholder="Select text stretch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="expanded">Expanded</SelectItem>
              <SelectItem value="condensed">Condensed</SelectItem>
              <SelectItem value="ultraExpanded">Ultra Expanded</SelectItem>
              <SelectItem value="extraExpanded">Extra Expanded</SelectItem>
              <SelectItem value="semiExpanded">Semi Expanded</SelectItem>
              <SelectItem value="semiCondensed">Semi Condensed</SelectItem>
              <SelectItem value="extraCondensed">Extra Condensed</SelectItem>
              <SelectItem value="ultraCondensed">Ultra Condensed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  },
}
