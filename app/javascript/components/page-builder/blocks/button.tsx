"use client"
import React from "react"

import { BoxIcon as ButtonIcon } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export const buttonBlock: BlockDefinition = {
  type: "button",
  label: "Button",
  icon: <ButtonIcon size={16} />,
  defaultProperties: {
    text: "Button",
    variant: "default",
    size: "default",
    href: "",
    align: "left",
  },
  render: ({ block, isSelected, onSelect }: BlockRendererProps) => {
    const { text, variant, size, href, align } = block.properties

    const containerClasses = cn(
      "w-full",
      align === "center" && "flex justify-center",
      align === "right" && "flex justify-end",
    )

    const buttonContent = (
      <Button variant={variant || "default"} size={size || "default"}>
        {text || "Button"}
      </Button>
    )

    return (
      <div
        className={containerClasses}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {href ? <a href={href}>{buttonContent}</a> : buttonContent}
      </div>
    )
  },
  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="button-text">Text</Label>
          <Input id="button-text" value={properties.text || ""} onChange={(e) => onChange("text", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="button-variant">Variant</Label>
          <Select value={properties.variant || "default"} onValueChange={(value) => onChange("variant", value)}>
            <SelectTrigger id="button-variant">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="destructive">Destructive</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="button-size">Size</Label>
          <Select value={properties.size || "default"} onValueChange={(value) => onChange("size", value)}>
            <SelectTrigger id="button-size">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="button-href">Link (URL)</Label>
          <Input
            id="button-href"
            value={properties.href || ""}
            onChange={(e) => onChange("href", e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label htmlFor="button-align">Alignment</Label>
          <Select value={properties.align || "left"} onValueChange={(value) => onChange("align", value)}>
            <SelectTrigger id="button-align">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  },
}
