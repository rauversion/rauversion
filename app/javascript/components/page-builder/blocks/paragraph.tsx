"use client"
import React from "react"

import { Type } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import SimpleEditor from "@/components/ui/SimpleEditor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"


export const paragraphBlock: BlockDefinition = {
  type: "paragraph",
  label: "Paragraph",
  icon: <Type size={16} />,
  defaultProperties: {
    text: "This is a paragraph of text. Edit this text to add your own content.",
    align: "left",
    color: "",
    fontSize: "base",
  },
  render: ({ block, isSelected, onSelect }: BlockRendererProps) => {
    const { text, align, color, fontSize } = block.properties

    const paragraphClasses = cn(
      "w-full",
      "prose-lg",
      align === "center" && "text-center",
      align === "right" && "text-right",
      fontSize === "xs" && "text-xs",
      fontSize === "sm" && "text-sm",
      fontSize === "base" && "text-base",
      fontSize === "lg" && "text-lg",
      fontSize === "xl" && "text-xl",
      fontSize === "2xl" && "text-2xl",
    )

    return (
      <div
        className="w-full"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <div
          className={paragraphClasses}
          style={{ color: color || "inherit" }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
    )
  },
  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="paragraph-text">Text</Label>
          <SimpleEditor
            id="paragraph-text"
            value={properties.text || ""}
            onChange={(value: string) => onChange("text", value)}
          />
        </div>
        <div>
          <Label htmlFor="paragraph-align">Alignment</Label>
          <Select value={properties.align || "left"} onValueChange={(value) => onChange("align", value)}>
            <SelectTrigger id="paragraph-align">
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
          <Label htmlFor="paragraph-font-size">Font Size</Label>
          <Select value={properties.fontSize || "base"} onValueChange={(value) => onChange("fontSize", value)}>
            <SelectTrigger id="paragraph-font-size">
              <SelectValue placeholder="Select font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xs">Extra Small</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="base">Medium (Default)</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
              <SelectItem value="2xl">2XL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="paragraph-color">Color</Label>
          <Input
            id="paragraph-color"
            type="text"
            value={properties.color || ""}
            onChange={(e) => onChange("color", e.target.value)}
            placeholder="#000000, rgb(0,0,0), etc."
          />
        </div>
      </div>
    )
  },
}
