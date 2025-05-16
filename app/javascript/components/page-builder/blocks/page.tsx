"use client"
import React from "react"

import { File } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BlockRenderer } from "../block-renderer"
import { useBlocks } from "../block-context"
import { usePageBuilder } from "../page-builder"
import { DroppableArea } from "../droppable-area"
import { ChromePicker } from "react-color"
import * as Popover from "@radix-ui/react-popover"

export const pageBlock: BlockDefinition = {
  type: "page",
  label: "Page",
  icon: <File size={16} />,
  defaultProperties: {
    width: "100%",
    maxWidth: "1200px",
    padding: 24,
    background: "#ffffff",
    textColor: "#000000",
    fontFamily: "system-ui, sans-serif",
    centered: true,
  },

  // Flag to indicate this block can have children
  canHaveChildren: true,

  render: ({ block, isSelected, onSelect, isChild, parentId }: BlockRendererProps) => {
    const { debug, moveBlock, addBlock } = useBlocks()
    const { selectedBlockId } = usePageBuilder()

    // Handle drop on the page
    const handlePageDrop = (item: any) => {
      if (item.id) {
        // Move existing block
        moveBlock(item.id, block.id, "children")
      } else if (item.type) {
        // Add new block from palette
        const newBlockId = addBlock(item.type)
        moveBlock(newBlockId, block.id, "children")
      }
    }

    // Extract properties with defaults
    const width = block.properties.width || "100%"
    const maxWidth = block.properties.maxWidth || "1200px"
    const padding = block.properties.padding || 24
    const background = block.properties.background || "#ffffff"
    const textColor = block.properties.textColor || "#000000"
    const fontFamily = block.properties.fontFamily || "system-ui, sans-serif"
    const centered = block.properties.centered !== false

    return (
      <div
        className={cn(
          "w-full min-h-[100vh] rounded-md transition-all",
          isSelected && "ring-2 ring-primary ring-offset-2",
          debug && "outline outline-2 outline-blue-500",
          "hover:border-primary/50 hover:bg-muted/10",
        )}
        style={{
          width,
          maxWidth: centered ? maxWidth : "none",
          marginLeft: centered ? "auto" : "0",
          marginRight: centered ? "auto" : "0",
          padding: `${padding}px`,
          background,
          color: textColor,
          fontFamily,
        }}
        data-page-id={block.id}
        data-parent-id={parentId || "none"}
        onClick={(e) => {
          // Prevent click from propagating to parent elements
          e.stopPropagation()
          onSelect()
        }}
      >
        <DroppableArea
          id={block.id}
          type="children"
          className="w-full min-h-[200px]"
          onDrop={handlePageDrop}
          isEmpty={!block.children || block.children.length === 0}
          emptyContent={debug ? `Page ID: ${block.id}` : "Drop blocks here to build your page"}
        >
          {block.children && block.children.length > 0 && (
            <div className="flex flex-col gap-4">
              {block.children.map((childBlock) => (
                <BlockRenderer
                  key={childBlock.id}
                  block={childBlock}
                  isSelected={selectedBlockId === childBlock.id}
                  onSelect={() => {
                    // Directly set the selected block ID when a child is clicked
                    if (typeof window !== "undefined") {
                      const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                      window.dispatchEvent(event)
                    }
                  }}
                  isChild={true}
                  parentId={block.id}
                  containerId={block.id}
                  containerType="children"
                />
              ))}
            </div>
          )}
        </DroppableArea>
      </div>
    )
  },

  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="page-width">Width</Label>
          <Input
            id="page-width"
            value={properties.width || "100%"}
            onChange={(e) => onChange("width", e.target.value)}
            placeholder="100%, 800px, etc."
          />
        </div>
        <div>
          <Label htmlFor="page-max-width">Max Width</Label>
          <Input
            id="page-max-width"
            value={properties.maxWidth || "1200px"}
            onChange={(e) => onChange("maxWidth", e.target.value)}
            placeholder="1200px, 80rem, etc."
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="page-padding">Padding (px)</Label>
            <span className="text-sm text-muted-foreground">{properties.padding || 24}px</span>
          </div>
          <Slider
            id="page-padding"
            min={0}
            max={80}
            // step={1}
            value={[properties.padding || 24]}
            onValueChange={([value]) => onChange("padding", value)}
          />
        </div>
        <div>
          <Label htmlFor="page-background">Background Color</Label>
          <div className="flex items-center gap-4">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label="Pick color"
                  className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                  style={{
                    background: properties.background || "transparent",
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
                  color={properties.background || "#fff"}
                  onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                    const { r, g, b, a } = color.rgb
                    const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                    onChange("background", value)
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
              id="page-background"
              type="text"
              value={properties.background || "#ffffff"}
              onChange={(e) => onChange("background", e.target.value)}
              placeholder="#ffffff, rgb(255,255,255), etc."
              className="w-36"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="page-text-color">Text Color</Label>
          <div className="flex items-center gap-4">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label="Pick color"
                  className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                  style={{
                    background: properties.textColor || "transparent",
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
                  color={properties.textColor || "#000"}
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
              id="page-text-color"
              type="text"
              value={properties.textColor || "#000000"}
              onChange={(e) => onChange("textColor", e.target.value)}
              placeholder="#000000, rgb(0,0,0), etc."
              className="w-36"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="page-font-family">Font Family</Label>
          <Select
            value={properties.fontFamily || "system-ui, sans-serif"}
            onValueChange={(value) => onChange("fontFamily", value)}
          >
            <SelectTrigger id="page-font-family">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="sans-serif">Sans Serif</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
              <SelectItem value="'Helvetica Neue', Arial, sans-serif">Helvetica</SelectItem>
              <SelectItem value="'Georgia', serif">Georgia</SelectItem>
              <SelectItem value="'Courier New', monospace">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="page-centered"
            checked={properties.centered !== false}
            onCheckedChange={(checked) => onChange("centered", checked)}
          />
          <Label htmlFor="page-centered">Center Content</Label>
        </div>
      </div>
    )
  },
}
