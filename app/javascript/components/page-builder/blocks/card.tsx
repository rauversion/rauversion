"use client"
import React from "react"

import { CreditCard, ChevronDown } from "lucide-react"
import type { Block, BlockDefinition, BlockRendererProps, ChildContainer, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBlocks } from "../block-context"
import { BlockRenderer } from "../block-renderer"
import { usePageBuilder } from "../page-builder"
import { DroppableArea } from "../droppable-area"
import { v4 as uuidv4 } from "uuid"
import { useState } from "react"

// Create a separate component for the property editor to properly manage hooks
function CardPropertyEditor({ properties, onChange }: PropertyEditorProps) {
  const [activeTab, setActiveTab] = useState("style")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <div>
            <Label htmlFor="card-background">Background Color</Label>
            <div className="flex gap-2">
              <div
                className="h-9 w-9 rounded-md border"
                style={{ backgroundColor: properties.background || "#ffffff" }}
              />
              <Input
                id="card-background"
                type="text"
                value={properties.background || "#ffffff"}
                onChange={(e) => onChange("background", e.target.value)}
                placeholder="#ffffff, rgb(255,255,255), etc."
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="card-border-radius">Border Radius</Label>
            <Select value={properties.borderRadius || "md"} onValueChange={(value) => onChange("borderRadius", value)}>
              <SelectTrigger id="card-border-radius">
                <SelectValue placeholder="Select border radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="card-shadow">Shadow</Label>
            <Select value={properties.shadow || "md"} onValueChange={(value) => onChange("shadow", value)}>
              <SelectTrigger id="card-shadow">
                <SelectValue placeholder="Select shadow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="card-border"
              checked={properties.border || false}
              onCheckedChange={(checked) => onChange("border", checked)}
            />
            <Label htmlFor="card-border">Show Border</Label>
          </div>

          {properties.border && (
            <div>
              <Label htmlFor="card-border-color">Border Color</Label>
              <div className="flex gap-2">
                <div
                  className="h-9 w-9 rounded-md border"
                  style={{ backgroundColor: properties.borderColor || "#e2e8f0" }}
                />
                <Input
                  id="card-border-color"
                  type="text"
                  value={properties.borderColor || "#e2e8f0"}
                  onChange={(e) => onChange("borderColor", e.target.value)}
                  placeholder="#e2e8f0, rgb(226,232,240), etc."
                  className="flex-1"
                />
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="card-padding">Padding (px)</Label>
              <span className="text-sm text-muted-foreground">{properties.padding || 16}px</span>
            </div>
            <Slider
              id="card-padding"
              min={0}
              max={40}
              step={4}
              value={[properties.padding || 16]}
              onValueChange={([value]) => onChange("padding", value)}
            />
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <div>
            <Label htmlFor="card-width">Width</Label>
            <Input
              id="card-width"
              value={properties.width || "100%"}
              onChange={(e) => onChange("width", e.target.value)}
              placeholder="100%, 300px, etc."
            />
          </div>

          <div>
            <Label htmlFor="card-max-width">Max Width</Label>
            <Input
              id="card-max-width"
              value={properties.maxWidth || "none"}
              onChange={(e) => onChange("maxWidth", e.target.value)}
              placeholder="none, 500px, etc."
            />
          </div>

          <div>
            <Label htmlFor="card-min-height">Min Height</Label>
            <Input
              id="card-min-height"
              value={properties.minHeight || "auto"}
              onChange={(e) => onChange("minHeight", e.target.value)}
              placeholder="auto, 200px, etc."
            />
          </div>

          <div>
            <Label htmlFor="card-layout">Layout Direction</Label>
            <Select value={properties.layout || "vertical"} onValueChange={(value) => onChange("layout", value)}>
              <SelectTrigger id="card-layout">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertical">Vertical</SelectItem>
                <SelectItem value="horizontal">Horizontal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {properties.layout === "horizontal" && (
            <div>
              <Label htmlFor="card-image-width">Image Width (for horizontal layout)</Label>
              <Input
                id="card-image-width"
                value={properties.imageWidth || "33%"}
                onChange={(e) => onChange("imageWidth", e.target.value)}
                placeholder="33%, 200px, etc."
              />
            </div>
          )}
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="card-show-header"
              checked={properties.showHeader !== false}
              onCheckedChange={(checked) => onChange("showHeader", checked)}
            />
            <Label htmlFor="card-show-header">Show Header</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="card-show-footer"
              checked={properties.showFooter !== false}
              onCheckedChange={(checked) => onChange("showFooter", checked)}
            />
            <Label htmlFor="card-show-footer">Show Footer</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="card-show-image"
              checked={properties.showImage || false}
              onCheckedChange={(checked) => onChange("showImage", checked)}
            />
            <Label htmlFor="card-show-image">Show Image</Label>
          </div>

          {properties.showImage && (
            <>
              <div>
                <Label htmlFor="card-image-position">Image Position</Label>
                <Select
                  value={properties.imagePosition || "top"}
                  onValueChange={(value) => onChange("imagePosition", value)}
                >
                  <SelectTrigger id="card-image-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="card-image-height">Image Height</Label>
                <Input
                  id="card-image-height"
                  value={properties.imageHeight || "200px"}
                  onChange={(e) => onChange("imageHeight", e.target.value)}
                  placeholder="200px, 30%, etc."
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to create card sections
export const createCardSections = (properties: Record<string, any>): ChildContainer[] => {
  const sections: ChildContainer[] = []

  // Add image container if enabled
  if (properties.showImage) {
    sections.push({
      id: uuidv4(),
      type: "image",
      children: [],
    })
  }

  // Add header container if enabled
  if (properties.showHeader !== false) {
    sections.push({
      id: uuidv4(),
      type: "header",
      children: [],
    })
  }

  // Always add body container
  sections.push({
    id: uuidv4(),
    type: "body",
    children: [],
  })

  // Add footer container if enabled
  if (properties.showFooter !== false) {
    sections.push({
      id: uuidv4(),
      type: "footer",
      children: [],
    })
  }

  return sections
}

export const cardBlock: BlockDefinition = {
  type: "card",
  label: "Card",
  icon: <CreditCard size={16} />,
  defaultProperties: {
    background: "#ffffff",
    borderRadius: "md",
    shadow: "md",
    border: true,
    borderColor: "#e2e8f0",
    padding: 16,
    width: "100%",
    maxWidth: "none",
    minHeight: "auto",
    layout: "vertical",
    imageWidth: "33%",
    showHeader: true,
    showFooter: true,
    showImage: false,
    imagePosition: "top",
    imageHeight: "200px",
  },

  // Add the getContainers function
  getContainers: (block: Block): ChildContainer[] => {
    // If containers already exist, return them
    if (block.containers && block.containers.length > 0) {
      return block.containers
    }

    // Otherwise create new containers based on properties
    return createCardSections(block.properties)
  },

  render: ({ block, isSelected, onSelect, isChild, parentId }: BlockRendererProps) => {
    const { debug, moveBlock, addBlock } = useBlocks()
    const { selectedBlockId } = usePageBuilder()
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Extract properties with defaults
    const {
      background = "#ffffff",
      borderRadius = "md",
      shadow = "md",
      border = true,
      borderColor = "#e2e8f0",
      padding = 16,
      width = "100%",
      maxWidth = "none",
      minHeight = "auto",
      layout = "vertical",
      imageWidth = "33%",
      showHeader = true,
      showFooter = true,
      showImage = false,
      imagePosition = "top",
      imageHeight = "200px",
    } = block.properties

    // Get containers
    const containers = block.containers || []

    // Find specific containers
    const imageContainer = containers.find((container) => container.type === "image")
    const headerContainer = containers.find((container) => container.type === "header")
    const bodyContainer = containers.find((container) => container.type === "body")
    const footerContainer = containers.find((container) => container.type === "footer")

    // Handle drop on a container
    const handleContainerDrop = (containerId: string, item: any) => {
      if (item.id) {
        // Move existing block
        moveBlock(item.id, containerId, "card-section")
      } else if (item.type) {
        // Add new block from palette
        const newBlockId = addBlock(item.type)
        moveBlock(newBlockId, containerId, "card-section")
      }
    }

    // Map borderRadius to Tailwind classes
    const borderRadiusClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
    }

    // Map shadow to Tailwind classes
    const shadowClasses = {
      none: "shadow-none",
      sm: "shadow-sm",
      md: "shadow",
      lg: "shadow-md",
      xl: "shadow-lg",
    }

    // Determine if we're using horizontal layout
    const isHorizontal = layout === "horizontal"

    // Determine image position classes
    const getImagePositionClass = () => {
      if (!showImage) return ""
      if (isHorizontal) {
        return imagePosition === "right" ? "order-last" : "order-first"
      }
      return imagePosition === "bottom" ? "order-last" : "order-first"
    }

    return (
      <div
        className={cn(
          "overflow-hidden",
          borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses] || "rounded-md",
          shadowClasses[shadow as keyof typeof shadowClasses] || "shadow",
          border && "border",
          debug && "outline outline-2 outline-yellow-500",
        )}
        style={{
          background,
          borderColor: border ? borderColor : "transparent",
          width,
          maxWidth: maxWidth === "none" ? "none" : maxWidth,
          minHeight,
        }}
        data-card-id={block.id}
        data-parent-id={parentId || "none"}
        onClick={(e) => {
          // Prevent click from propagating to parent elements
          e.stopPropagation()
          onSelect()
        }}
      >
        {debug && (
          <div className="flex items-center justify-between bg-yellow-100 px-2 py-1 text-xs">
            <span>Card ID: {block.id}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsCollapsed(!isCollapsed)
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              {isCollapsed ? "Expand" : "Collapse"}
              <ChevronDown size={12} className={cn("transition-transform", isCollapsed ? "rotate-180" : "rotate-0")} />
            </button>
          </div>
        )}

        {!isCollapsed && (
          <div
            className={cn("flex", isHorizontal ? "flex-row" : "flex-col", isHorizontal && "flex-wrap md:flex-nowrap")}
          >
            {/* Image Section */}
            {showImage && imageContainer && (
              <div
                className={cn(getImagePositionClass(), isHorizontal ? `w-full md:w-[${imageWidth}]` : "w-full")}
                style={{ height: isHorizontal ? "auto" : imageHeight }}
              >
                <DroppableArea
                  id={imageContainer.id}
                  type="cell"
                  className="h-full w-full"
                  onDrop={(item) => handleContainerDrop(imageContainer.id, item)}
                  isEmpty={!imageContainer.children || imageContainer.children.length === 0}
                  emptyContent={
                    debug ? `Image Section ID: ${imageContainer.id}` : "Drop image block here for card image"
                  }
                >
                  {imageContainer.children && imageContainer.children.length > 0 && (
                    <div className="h-full w-full">
                      {imageContainer.children.map((childBlock) => (
                        <BlockRenderer
                          key={childBlock.id}
                          block={childBlock}
                          isSelected={selectedBlockId === childBlock.id}
                          onSelect={() => {
                            if (typeof window !== "undefined") {
                              const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                              window.dispatchEvent(event)
                            }
                          }}
                          isChild={true}
                          parentId={block.id}
                          containerId={imageContainer.id}
                          containerType="cell"
                        />
                      ))}
                    </div>
                  )}
                </DroppableArea>
              </div>
            )}

            <div className={cn("flex flex-col", isHorizontal ? `flex-1` : "w-full")}>
              {/* Header Section */}
              {showHeader && headerContainer && (
                <div className={cn("border-b p-4")}>
                  <DroppableArea
                    id={headerContainer.id}
                    type="cell"
                    className="w-full"
                    onDrop={(item) => handleContainerDrop(headerContainer.id, item)}
                    isEmpty={!headerContainer.children || headerContainer.children.length === 0}
                    emptyContent={debug ? `Header ID: ${headerContainer.id}` : "Drop blocks here for card header"}
                  >
                    {headerContainer.children && headerContainer.children.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {headerContainer.children.map((childBlock) => (
                          <BlockRenderer
                            key={childBlock.id}
                            block={childBlock}
                            isSelected={selectedBlockId === childBlock.id}
                            onSelect={() => {
                              if (typeof window !== "undefined") {
                                const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                                window.dispatchEvent(event)
                              }
                            }}
                            isChild={true}
                            parentId={block.id}
                            containerId={headerContainer.id}
                            containerType="cell"
                          />
                        ))}
                      </div>
                    )}
                  </DroppableArea>
                </div>
              )}

              {/* Body Section */}
              {bodyContainer && (
                <div className={cn("flex-1 p-4")}>
                  <DroppableArea
                    id={bodyContainer.id}
                    type="cell"
                    className="w-full"
                    onDrop={(item) => handleContainerDrop(bodyContainer.id, item)}
                    isEmpty={!bodyContainer.children || bodyContainer.children.length === 0}
                    emptyContent={debug ? `Body ID: ${bodyContainer.id}` : "Drop blocks here for card body"}
                  >
                    {bodyContainer.children && bodyContainer.children.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {bodyContainer.children.map((childBlock) => (
                          <BlockRenderer
                            key={childBlock.id}
                            block={childBlock}
                            isSelected={selectedBlockId === childBlock.id}
                            onSelect={() => {
                              if (typeof window !== "undefined") {
                                const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                                window.dispatchEvent(event)
                              }
                            }}
                            isChild={true}
                            parentId={block.id}
                            containerId={bodyContainer.id}
                            containerType="cell"
                          />
                        ))}
                      </div>
                    )}
                  </DroppableArea>
                </div>
              )}

              {/* Footer Section */}
              {showFooter && footerContainer && (
                <div className={cn("border-t p-4")}>
                  <DroppableArea
                    id={footerContainer.id}
                    type="cell"
                    className="w-full"
                    onDrop={(item) => handleContainerDrop(footerContainer.id, item)}
                    isEmpty={!footerContainer.children || footerContainer.children.length === 0}
                    emptyContent={debug ? `Footer ID: ${footerContainer.id}` : "Drop blocks here for card footer"}
                  >
                    {footerContainer.children && footerContainer.children.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {footerContainer.children.map((childBlock) => (
                          <BlockRenderer
                            key={childBlock.id}
                            block={childBlock}
                            isSelected={selectedBlockId === childBlock.id}
                            onSelect={() => {
                              if (typeof window !== "undefined") {
                                const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                                window.dispatchEvent(event)
                              }
                            }}
                            isChild={true}
                            parentId={block.id}
                            containerId={footerContainer.id}
                            containerType="cell"
                          />
                        ))}
                      </div>
                    )}
                  </DroppableArea>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  },

  // Use the separate component for property editing to properly manage hooks
  propertyEditor: (props: PropertyEditorProps) => <CardPropertyEditor {...props} />,
}
