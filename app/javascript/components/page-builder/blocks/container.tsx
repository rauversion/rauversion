"use client"
import React from "react"

import { LayoutGrid } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BlockRenderer } from "../block-renderer"
import { SortableContext } from "@dnd-kit/sortable"
import { SortableBlock } from "../sortable-block"
import { SortableBlockList } from "../sortable-block-list"
import { useBlocks } from "../block-context"
import { usePageBuilder } from "../page-builder"
import { DroppableArea } from "../droppable-area"

export const containerBlock: BlockDefinition = {
  type: "container",
  label: "Container",
  icon: <LayoutGrid size={16} />,
  defaultProperties: {
    direction: "column",
    gap: 4,
    padding: 4,
    background: "transparent",
    border: false,
    justify: "start", // Tailwind: justify-start
    margin: "",       // e.g., mx-auto, my-4, etc.
    width: "full",    // Tailwind: w-full
    mobileWidth: "full",    // Tailwind: sm:w-full
    mobilePadding: 4,       // px value for mobile
    mobileMargin: "",       // e.g., sm:mx-auto, sm:my-4, etc.
    tabletWidth: "full",    // Tailwind: md:w-full
    tabletPadding: 4,       // px value for tablet
    tabletMargin: "",       // e.g., md:mx-auto, md:my-4, etc.
    desktopWidth: "full",   // Tailwind: lg:w-full
    desktopPadding: 4,      // px value for desktop
    desktopMargin: "",      // e.g., lg:mx-auto, lg:my-4, etc.
    desktopDirection: "column",
    desktopJustify: "start",
  },

  // Flag to indicate this block can have children
  canHaveChildren: true,

  render: ({ block, isSelected, onSelect, isChild, parentId, isPreview }: BlockRendererProps) => {
    const { debug, moveBlock, addBlock } = useBlocks()
    const { selectedBlockId } = usePageBuilder()

    // Update the handleContainerDrop function to handle new blocks from the palette
    const handleContainerDrop = (item: any) => {
      if (item.id) {
        // Move existing block
        moveBlock(item.id, block.id, "children")
      } else if (item.type) {
        // Add new block from palette
        const newBlockId = addBlock(item.type)
        moveBlock(newBlockId, block.id, "children")
      }
    }

    return (
      <div
        className={cn(
          "flex rounded-md",
          // Mobile (base)
          (block.properties.mobileDirection || block.properties.direction) === "row"
            ? "flex-row"
            : "flex-col",
          block.properties.mobileJustify || block.properties.justify
            ? `justify-${block.properties.mobileJustify || block.properties.justify}`
            : "",
          block.properties.mobileMargin || block.properties.margin,
          block.properties.mobileWidth || block.properties.width
            ? `w-${block.properties.mobileWidth || block.properties.width}`
            : "",
          // Tablet (md:)
          block.properties.tabletDirection
            ? `md:flex-${block.properties.tabletDirection}`
            : "",
          block.properties.tabletJustify
            ? `md:justify-${block.properties.tabletJustify}`
            : "",
          block.properties.tabletMargin
            ? `md:${block.properties.tabletMargin}`
            : "",
          block.properties.tabletWidth
            ? `md:w-${block.properties.tabletWidth}`
            : "",
          // Desktop (lg:) - fallback to base if not set
          block.properties.direction
            ? `lg:flex-${block.properties.direction}`
            : "",
          block.properties.justify
            ? `lg:justify-${block.properties.justify}`
            : "",
          block.properties.margin
            ? `lg:${block.properties.margin}`
            : "",
          block.properties.width
            ? `lg:w-${block.properties.width}`
            : "",
          block.properties.border && "border",
          debug && "outline outline-2 outline-green-500",
          "hover:border-primary/50 hover:bg-muted/10",
        )}
        style={{
          gap: `${block.properties.gap || 4}px`,
          padding: `${block.properties.padding || 4}px`,
          background: block.properties.background || "transparent",
          ...(block.properties.mobilePadding !== undefined
            ? {
                // Mobile padding via media query
                "--container-mobile-padding": `${block.properties.mobilePadding}px`,
              }
            : {}),
        }}
        data-container-id={block.id}
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
          className="w-full min-h-[100px]"
          onDrop={handleContainerDrop}
          isEmpty={!block.children || block.children.length === 0}
          emptyContent={debug ? `Container ID: ${block.id}` : "Drop blocks here"}
        >
          {block.children && block.children.length > 0 && (
            <SortableBlockList
              blocks={block.children}
              direction={block.properties.direction}
              isPreview={isPreview}
              selectedBlockId={selectedBlockId ?? undefined}
              parentId={block.id}
              containerId={block.id}
              containerType="children"
            />
          )}
        </DroppableArea>
      </div>
    )
  },

  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <Tabs defaultValue="desktop" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="tablet">Tablet</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>
        <TabsContent value="desktop">
          <div className="space-y-4">
            <div>
              <Label htmlFor="container-direction">Direction</Label>
              <Select
                value={properties.direction ?? ""}
                onValueChange={(value) => onChange("direction", value)}
              >
                <SelectTrigger id="container-direction">
                  <SelectValue placeholder={(!properties.direction && (properties.tabletDirection || properties.mobileDirection)) ? "Inherited" : "Select direction"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row">Row</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.direction && (properties.tabletDirection || properties.mobileDirection)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <Label htmlFor="container-justify">Justify Content</Label>
              <Select
                value={properties.justify ?? ""}
                onValueChange={(value) => onChange("justify", value)}
              >
                <SelectTrigger id="container-justify">
                  <SelectValue placeholder={(!properties.justify && (properties.tabletJustify || properties.mobileJustify)) ? "Inherited" : "Select justify"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                  <SelectItem value="around">Around</SelectItem>
                  <SelectItem value="evenly">Evenly</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.justify && (properties.tabletJustify || properties.mobileJustify)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <Label htmlFor="container-margin">Margin</Label>
              <Select
                value={properties.margin !== undefined && properties.margin !== "" ? properties.margin : ""}
                onValueChange={(value) => {
                  if (value === "none" || value === "") {
                    onChange("margin", "")
                  } else {
                    onChange("margin", value)
                  }
                }}
              >
                <SelectTrigger id="container-margin">
                  <SelectValue placeholder={(!properties.margin && (properties.tabletMargin || properties.mobileMargin)) ? "Inherited" : "Select margin"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mx-auto">lg:mx-auto</SelectItem>
                  <SelectItem value="my-4">lg:my-4</SelectItem>
                  <SelectItem value="mt-4">lg:mt-4</SelectItem>
                  <SelectItem value="mb-4">lg:mb-4</SelectItem>
                  <SelectItem value="ml-4">lg:ml-4</SelectItem>
                  <SelectItem value="mr-4">lg:mr-4</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.margin && (properties.tabletMargin || properties.mobileMargin)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            
            <div>
              <Label htmlFor="container-width">Width</Label>
              <Select
                value={properties.width ?? ""}
                onValueChange={(value) => onChange("width", value)}
              >
                <SelectTrigger id="container-width">
                  <SelectValue placeholder={(!properties.width && (properties.tabletWidth || properties.mobileWidth)) ? "Inherited" : "Select width"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">lg:w-full</SelectItem>
                  <SelectItem value="1/2">lg:w-1/2</SelectItem>
                  <SelectItem value="1/3">lg:w-1/3</SelectItem>
                  <SelectItem value="2/3">lg:w-2/3</SelectItem>
                  <SelectItem value="1/4">lg:w-1/4</SelectItem>
                  <SelectItem value="3/4">lg:w-3/4</SelectItem>
                  <SelectItem value="auto">lg:w-auto</SelectItem>
                  <SelectItem value="screen">lg:w-screen</SelectItem>
                  <SelectItem value="min">lg:w-min</SelectItem>
                  <SelectItem value="max">lg:w-max</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.width && (properties.tabletWidth || properties.mobileWidth)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="container-gap">Gap (px)</Label>
                <span className="text-sm text-muted-foreground">{properties.gap || 4}px</span>
              </div>
              <Slider
                id="container-gap"
                min={0}
                max={40}
                step={4}
                value={[properties.gap || 4]}
                onValueChange={([value]) => onChange("gap", value)}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="container-padding">Padding (px)</Label>
                <span className="text-sm text-muted-foreground">{properties.padding || 4}px</span>
              </div>
              <Slider
                id="container-padding"
                min={0}
                max={40}
                step={4}
                value={[properties.padding || 4]}
                onValueChange={([value]) => onChange("padding", value)}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tablet">
          <div className="space-y-4">
            <div>
              <Label htmlFor="container-tablet-direction">Direction</Label>
              <Select
                value={properties.tabletDirection || properties.direction || properties.mobileDirection || "column"}
                onValueChange={(value) => onChange("tabletDirection", value)}
              >
                <SelectTrigger id="container-tablet-direction">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row">Row</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.tabletDirection && (properties.direction || properties.mobileDirection)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <Label htmlFor="container-tablet-justify">Justify Content</Label>
              <Select
                value={properties.tabletJustify || properties.justify || properties.mobileJustify || "start"}
                onValueChange={(value) => onChange("tabletJustify", value)}
              >
                <SelectTrigger id="container-tablet-justify">
                  <SelectValue placeholder="Select justify" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                  <SelectItem value="around">Around</SelectItem>
                  <SelectItem value="evenly">Evenly</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.tabletJustify && (properties.justify || properties.mobileJustify)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <Label htmlFor="container-tablet-margin">Margin</Label>
              <Select
                value={properties.tabletMargin && properties.tabletMargin !== "" ? properties.tabletMargin
                  : properties.margin && properties.margin !== "" ? properties.margin
                  : properties.mobileMargin && properties.mobileMargin !== "" ? properties.mobileMargin
                  : "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    onChange("tabletMargin", "")
                  } else {
                    onChange("tabletMargin", value)
                  }
                }}
              >
                <SelectTrigger id="container-tablet-margin">
                  <SelectValue placeholder="Select margin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mx-auto">md:mx-auto</SelectItem>
                  <SelectItem value="my-4">md:my-4</SelectItem>
                  <SelectItem value="mt-4">md:mt-4</SelectItem>
                  <SelectItem value="mb-4">md:mb-4</SelectItem>
                  <SelectItem value="ml-4">md:ml-4</SelectItem>
                  <SelectItem value="mr-4">md:mr-4</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.tabletMargin && (properties.margin || properties.mobileMargin)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <Label htmlFor="container-tablet-width">Width</Label>
              <Select
                value={properties.tabletWidth || properties.width || properties.mobileWidth || "full"}
                onValueChange={(value) => onChange("tabletWidth", value)}
              >
                <SelectTrigger id="container-tablet-width">
                  <SelectValue placeholder="Select tablet width" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">md:w-full</SelectItem>
                  <SelectItem value="1/2">md:w-1/2</SelectItem>
                  <SelectItem value="1/3">md:w-1/3</SelectItem>
                  <SelectItem value="2/3">md:w-2/3</SelectItem>
                  <SelectItem value="1/4">md:w-1/4</SelectItem>
                  <SelectItem value="3/4">md:w-3/4</SelectItem>
                  <SelectItem value="auto">md:w-auto</SelectItem>
                  <SelectItem value="screen">md:w-screen</SelectItem>
                  <SelectItem value="min">md:w-min</SelectItem>
                  <SelectItem value="max">md:w-max</SelectItem>
                </SelectContent>
              </Select>
              {(!properties.tabletWidth && (properties.width || properties.mobileWidth)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="container-tablet-padding">Padding (px)</Label>
                <span className="text-sm text-muted-foreground">{properties.tabletPadding || properties.padding || properties.mobilePadding || 4}px</span>
              </div>
              <Slider
                id="container-tablet-padding"
                min={0}
                max={40}
                step={4}
                value={[properties.tabletPadding || properties.padding || properties.mobilePadding || 4]}
                onValueChange={([value]) => onChange("tabletPadding", value)}
              />
              {(!properties.tabletPadding && (properties.padding || properties.mobilePadding)) && (
                <span className="text-xs text-muted-foreground ml-2">(inherited)</span>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="mobile">
          <div className="space-y-4">
            <div>
              <Label htmlFor="container-mobile-direction">Direction</Label>
              <Select
                value={properties.mobileDirection || "column"}
                onValueChange={(value) => onChange("mobileDirection", value)}
              >
                <SelectTrigger id="container-mobile-direction">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row">Row</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="container-mobile-justify">Justify Content</Label>
              <Select
                value={properties.mobileJustify || "start"}
                onValueChange={(value) => onChange("mobileJustify", value)}
              >
                <SelectTrigger id="container-mobile-justify">
                  <SelectValue placeholder="Select justify" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="end">End</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                  <SelectItem value="around">Around</SelectItem>
                  <SelectItem value="evenly">Evenly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="container-mobile-margin">Mobile Margin</Label>
              <Select
                value={properties.mobileMargin && properties.mobileMargin !== "" ? properties.mobileMargin : "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    onChange("mobileMargin", "")
                  } else {
                    onChange("mobileMargin", value)
                  }
                }}
              >
                <SelectTrigger id="container-mobile-margin">
                  <SelectValue placeholder="Select mobile margin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mx-auto">mx-auto</SelectItem>
                  <SelectItem value="my-4">my-4</SelectItem>
                  <SelectItem value="mt-4">mt-4</SelectItem>
                  <SelectItem value="mb-4">mb-4</SelectItem>
                  <SelectItem value="ml-4">ml-4</SelectItem>
                  <SelectItem value="mr-4">mr-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="container-mobile-width">Mobile Width</Label>
              <Select
                value={properties.mobileWidth || "full"}
                onValueChange={(value) => onChange("mobileWidth", value)}
              >
                <SelectTrigger id="container-mobile-width">
                  <SelectValue placeholder="Select mobile width" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">w-full</SelectItem>
                  <SelectItem value="1/2">w-1/2</SelectItem>
                  <SelectItem value="1/3">w-1/3</SelectItem>
                  <SelectItem value="2/3">w-2/3</SelectItem>
                  <SelectItem value="1/4">w-1/4</SelectItem>
                  <SelectItem value="3/4">w-3/4</SelectItem>
                  <SelectItem value="auto">w-auto</SelectItem>
                  <SelectItem value="screen">w-screen</SelectItem>
                  <SelectItem value="min">w-min</SelectItem>
                  <SelectItem value="max">w-max</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="container-mobile-padding">Mobile Padding (px)</Label>
                <span className="text-sm text-muted-foreground">{properties.mobilePadding || 4}px</span>
              </div>
              <Slider
                id="container-mobile-padding"
                min={0}
                max={40}
                step={4}
                value={[properties.mobilePadding || 4]}
                onValueChange={([value]) => onChange("mobilePadding", value)}
              />
            </div>
          </div>
        </TabsContent>
        <div className="mt-6">
          <Label htmlFor="container-background">Background</Label>
          <Input
            id="container-background"
            type="text"
            value={properties.background || "transparent"}
            onChange={(e) => onChange("background", e.target.value)}
            placeholder="transparent, #f5f5f5, etc."
          />
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="container-border"
            checked={properties.border || false}
            onCheckedChange={(checked) => onChange("border", checked)}
          />
          <Label htmlFor="container-border">Show Border</Label>
        </div>
      </Tabs>
    )
  },
}
