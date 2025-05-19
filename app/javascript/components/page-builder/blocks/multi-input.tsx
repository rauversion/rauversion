"use client"
import React from "react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChromePicker } from "react-color"
import * as Popover from "@radix-ui/react-popover"

export const multiInputBlock: BlockDefinition = {
  type: "multi-input",
  label: "Multi Input",
  icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  defaultProperties: {
    label: "Multi List",
    items: [""],
    textColor: "#222222"
  },

  render: ({ block }: BlockRendererProps) => {
    const { label, items = [] } = block.properties
    return (
      <div className="p-4">
        {label && <div className="font-semibold mb-2">{label}</div>}
        <ul className="list-disc pl-5 space-y-1" style={{ color: block.properties.textColor || "#222222" }}>
          {items.map((item: string, idx: number) =>
            item ? <li key={idx}>{item}</li> : null
          )}
        </ul>
      </div>
    )
  },

  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="multi-label">Label</Label>
        <Input
          id="multi-label"
          value={properties.label || ""}
          onChange={e => onChange("label", e.target.value)}
        />
      </div>
      <div>
        <Label>Text Color</Label>
        <div className="flex items-center gap-2 mb-2">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.textColor || "#222222",
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
                color={properties.textColor || "#222222"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("textColor", value)
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
            value={properties.textColor || "#222222"}
            onChange={e => onChange("textColor", e.target.value)}
            placeholder="#222222"
            type="text"
            className="w-24"
          />
        </div>
      </div>
      <div>
        <Label>Items</Label>
        {(properties.items || []).map((item: string, idx: number) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <Input
              value={item}
              onChange={e => {
                const updated = [...(properties.items || [])]
                updated[idx] = e.target.value
                onChange("items", updated)
              }}
              placeholder="Add item..."
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                const updated = (properties.items || []).filter((_: any, i: number) => i !== idx)
                onChange("items", updated)
              }}
              aria-label="Remove"
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange("items", [...(properties.items || []), ""])}
        >
          + Add
        </Button>
      </div>
    </div>
  ),
}
