"use client"
import React from "react"

import { useState } from "react"
import { LayoutIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DroppableArea } from "../droppable-area"
import { BlockRenderer } from "../block-renderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { Block, BlockDefinition, BlockRendererProps, ChildContainer, PropertyEditorProps } from "./types"

// Default properties for the flex container
const defaultProperties = {
  // Layout properties
  direction: "row",
  wrap: "nowrap",
  justifyContent: "flex-start",
  alignItems: "stretch",
  alignContent: "stretch",
  gap: 2,

  // Spacing properties
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,

  // Appearance properties
  backgroundColor: "#ffffff",
  backgroundOpacity: 100,
  borderWidth: 0,
  borderStyle: "solid",
  borderColor: "#000000",
  borderRadius: 0,

  // Responsive properties
  stackOnMobile: false,
  stackBreakpoint: "md",
}

// Render the flex container
const FlexRenderer = ({ block, isSelected, onSelect, isChild = false }: BlockRendererProps) => {
  const { properties, containers = [] } = block

  // Find the flex container or create a default one if it doesn't exist
  const flexContainer = containers.find((c) => c.type === "flex-container") || {
    id: "default-flex-container",
    type: "flex-container",
    children: [],
  }

  // Combine all properties with defaults
  const {
    direction = defaultProperties.direction,
    wrap = defaultProperties.wrap,
    justifyContent = defaultProperties.justifyContent,
    alignItems = defaultProperties.alignItems,
    alignContent = defaultProperties.alignContent,
    gap = defaultProperties.gap,
    paddingTop = defaultProperties.paddingTop,
    paddingRight = defaultProperties.paddingRight,
    paddingBottom = defaultProperties.paddingBottom,
    paddingLeft = defaultProperties.paddingLeft,
    marginTop = defaultProperties.marginTop,
    marginRight = defaultProperties.marginRight,
    marginBottom = defaultProperties.marginBottom,
    marginLeft = defaultProperties.marginLeft,
    backgroundColor = defaultProperties.backgroundColor,
    backgroundOpacity = defaultProperties.backgroundOpacity,
    borderWidth = defaultProperties.borderWidth,
    borderStyle = defaultProperties.borderStyle,
    borderColor = defaultProperties.borderColor,
    borderRadius = defaultProperties.borderRadius,
    stackOnMobile = defaultProperties.stackOnMobile,
    stackBreakpoint = defaultProperties.stackBreakpoint,
  } = properties

  // Convert justifyContent values to Tailwind classes
  const justifyContentMap: Record<string, string> = {
    "flex-start": "justify-start",
    "flex-end": "justify-end",
    center: "justify-center",
    "space-between": "justify-between",
    "space-around": "justify-around",
    "space-evenly": "justify-evenly",
  }

  // Convert alignItems values to Tailwind classes
  const alignItemsMap: Record<string, string> = {
    stretch: "items-stretch",
    "flex-start": "items-start",
    "flex-end": "items-end",
    center: "items-center",
    baseline: "items-baseline",
  }

  // Convert alignContent values to Tailwind classes
  const alignContentMap: Record<string, string> = {
    stretch: "content-stretch",
    "flex-start": "content-start",
    "flex-end": "content-end",
    center: "content-center",
    "space-between": "content-between",
    "space-around": "content-around",
  }

  // Build the flex container classes
  const flexClasses = cn(
    "relative",
    "flex",
    // Direction
    direction === "row"
      ? "flex-row"
      : direction === "column"
        ? "flex-col"
        : direction === "row-reverse"
          ? "flex-row-reverse"
          : "flex-col-reverse",

    // Wrap
    wrap === "nowrap" ? "flex-nowrap" : wrap === "wrap" ? "flex-wrap" : "flex-wrap-reverse",

    // Justify content
    justifyContentMap[justifyContent] || "justify-start",

    // Align items
    alignItemsMap[alignItems] || "items-stretch",

    // Align content
    alignContentMap[alignContent] || "content-stretch",

    // Responsive stacking
    stackOnMobile && `${stackBreakpoint}:flex-row ${stackBreakpoint}:flex-col`,

    // Border
    borderWidth > 0 && "border",

    // Selected state
    isSelected && "ring-2 ring-blue-500",
  )

  // Calculate the gap in rem
  const gapValue = `${gap * 0.25}rem`

  // Calculate padding and margin in rem
  const paddingValue = {
    top: `${paddingTop * 0.25}rem`,
    right: `${paddingRight * 0.25}rem`,
    bottom: `${paddingBottom * 0.25}rem`,
    left: `${paddingLeft * 0.25}rem`,
  }

  const marginValue = {
    top: `${marginTop * 0.25}rem`,
    right: `${marginRight * 0.25}rem`,
    bottom: `${marginBottom * 0.25}rem`,
    left: `${marginLeft * 0.25}rem`,
  }

  // Calculate background color with opacity
  const bgColorWithOpacity =
    backgroundColor && backgroundOpacity < 100
      ? `${backgroundColor}${Math.round((backgroundOpacity / 100) * 255)
          .toString(16)
          .padStart(2, "0")}`
      : backgroundColor

  // Inline styles for properties that can't be easily done with Tailwind
  const inlineStyles = {
    gap: gapValue,
    padding: `${paddingValue.top} ${paddingValue.right} ${paddingValue.bottom} ${paddingValue.left}`,
    margin: `${marginValue.top} ${marginValue.right} ${marginValue.bottom} ${marginValue.left}`,
    backgroundColor: bgColorWithOpacity,
    borderWidth: borderWidth > 0 ? `${borderWidth}px` : undefined,
    borderStyle: borderWidth > 0 ? borderStyle : undefined,
    borderColor: borderWidth > 0 ? borderColor : undefined,
    borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
  }

  return (
    <div
      className={flexClasses}
      style={inlineStyles}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      data-block-id={block.id}
      data-block-type="flex"
    >
      {/* Debug rendering */}
      {window.DEBUG_RENDER && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 z-50">Flex: {block.id}</div>
      )}

      {/* Droppable area for child blocks */}
      <DroppableArea
        id={flexContainer.id}
        type="cell"
        className="w-full h-full min-h-[50px]"
        isEmpty={!flexContainer.children || flexContainer.children.length === 0}
        emptyContent={window.DEBUG_RENDER ? `Flex Container ID: ${flexContainer.id}` : "Drop blocks here"}
      >
        {flexContainer.children.map((childBlock: any) => (
            <BlockRenderer
              key={childBlock.id}
              block={childBlock}
              isSelected={false}
              onSelect={() => {}}
              isChild={true}
              parentId={block.id}
              containerId={flexContainer.id}
              containerType="cell"
            />
          ))
        }
      </DroppableArea>
    </div>
  )
}

export function FlexPropertyEditor({ properties, onChange }: PropertyEditorProps) {
  const [activeTab, setActiveTab] = useState("layout")

  // Combine properties with defaults
  const {
    direction = defaultProperties.direction,
    wrap = defaultProperties.wrap,
    justifyContent = defaultProperties.justifyContent,
    alignItems = defaultProperties.alignItems,
    alignContent = defaultProperties.alignContent,
    gap = defaultProperties.gap,
    paddingTop = defaultProperties.paddingTop,
    paddingRight = defaultProperties.paddingRight,
    paddingBottom = defaultProperties.paddingBottom,
    paddingLeft = defaultProperties.paddingLeft,
    marginTop = defaultProperties.marginTop,
    marginRight = defaultProperties.marginRight,
    marginBottom = defaultProperties.marginBottom,
    marginLeft = defaultProperties.marginLeft,
    backgroundColor = defaultProperties.backgroundColor,
    backgroundOpacity = defaultProperties.backgroundOpacity,
    borderWidth = defaultProperties.borderWidth,
    borderStyle = defaultProperties.borderStyle,
    borderColor = defaultProperties.borderColor,
    borderRadius = defaultProperties.borderRadius,
    stackOnMobile = defaultProperties.stackOnMobile,
    stackBreakpoint = defaultProperties.stackBreakpoint,
  } = properties

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
        </TabsList>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          {/* Direction */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(value) => onChange("direction", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="row">Row</SelectItem>
                <SelectItem value="column">Column</SelectItem>
                <SelectItem value="row-reverse">Row Reverse</SelectItem>
                <SelectItem value="column-reverse">Column Reverse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wrap */}
          <div className="space-y-2">
            <Label>Wrap</Label>
            <Select value={wrap} onValueChange={(value) => onChange("wrap", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select wrap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nowrap">No Wrap</SelectItem>
                <SelectItem value="wrap">Wrap</SelectItem>
                <SelectItem value="wrap-reverse">Wrap Reverse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Justify Content */}
          <div className="space-y-2">
            <Label>Justify Content</Label>
            <Select value={justifyContent} onValueChange={(value) => onChange("justifyContent", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select justify content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flex-start">Start</SelectItem>
                <SelectItem value="flex-end">End</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="space-between">Space Between</SelectItem>
                <SelectItem value="space-around">Space Around</SelectItem>
                <SelectItem value="space-evenly">Space Evenly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Align Items */}
          <div className="space-y-2">
            <Label>Align Items</Label>
            <Select value={alignItems} onValueChange={(value) => onChange("alignItems", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select align items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stretch">Stretch</SelectItem>
                <SelectItem value="flex-start">Start</SelectItem>
                <SelectItem value="flex-end">End</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="baseline">Baseline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Align Content */}
          <div className="space-y-2">
            <Label>Align Content</Label>
            <Select value={alignContent} onValueChange={(value) => onChange("alignContent", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select align content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stretch">Stretch</SelectItem>
                <SelectItem value="flex-start">Start</SelectItem>
                <SelectItem value="flex-end">End</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="space-between">Space Between</SelectItem>
                <SelectItem value="space-around">Space Around</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gap */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Gap</Label>
              <span className="text-sm text-gray-500">{gap * 0.25}rem</span>
            </div>
            <Slider value={[gap]} min={0} max={16} step={1} onValueChange={(value) => onChange("gap", value[0])} />
          </div>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="space-y-4">
          {/* Padding */}
          <div className="space-y-2">
            <Label>Padding (rem)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Top</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[paddingTop]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("paddingTop", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{paddingTop * 0.25}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Right</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[paddingRight]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("paddingRight", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{paddingRight * 0.25}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Bottom</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[paddingBottom]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("paddingBottom", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{paddingBottom * 0.25}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Left</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[paddingLeft]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("paddingLeft", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{paddingLeft * 0.25}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Margin */}
          <div className="space-y-2">
            <Label>Margin (rem)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Top</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[marginTop]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("marginTop", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{marginTop * 0.25}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Right</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[marginRight]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("marginRight", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{marginRight * 0.25}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Bottom</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[marginBottom]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("marginBottom", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{marginBottom * 0.25}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Left</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[marginLeft]}
                    min={0}
                    max={16}
                    step={1}
                    onValueChange={(value) => onChange("marginLeft", value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{marginLeft * 0.25}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          {/* Background Color */}
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Background Opacity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Background Opacity</Label>
              <span className="text-sm text-gray-500">{backgroundOpacity}%</span>
            </div>
            <Slider
              value={[backgroundOpacity]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => onChange("backgroundOpacity", value[0])}
            />
          </div>

          {/* Border Width */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Border Width</Label>
              <span className="text-sm text-gray-500">{borderWidth}px</span>
            </div>
            <Slider
              value={[borderWidth]}
              min={0}
              max={10}
              step={1}
              onValueChange={(value) => onChange("borderWidth", value[0])}
            />
          </div>

          {/* Border Style */}
          <div className="space-y-2">
            <Label>Border Style</Label>
            <Select value={borderStyle} onValueChange={(value) => onChange("borderStyle", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select border style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Border Color */}
          <div className="space-y-2">
            <Label>Border Color</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={borderColor}
                onChange={(e) => onChange("borderColor", e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                type="text"
                value={borderColor}
                onChange={(e) => onChange("borderColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Border Radius</Label>
              <span className="text-sm text-gray-500">{borderRadius}px</span>
            </div>
            <Slider
              value={[borderRadius]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("borderRadius", value[0])}
            />
          </div>
        </TabsContent>

        {/* Responsive Tab */}
        <TabsContent value="responsive" className="space-y-4">
          {/* Stack on Mobile */}
          <div className="flex items-center justify-between">
            <Label>Stack on Mobile</Label>
            <Switch checked={stackOnMobile} onCheckedChange={(checked) => onChange("stackOnMobile", checked)} />
          </div>

          {/* Stack Breakpoint */}
          {stackOnMobile && (
            <div className="space-y-2">
              <Label>Stack Breakpoint</Label>
              <Select value={stackBreakpoint} onValueChange={(value) => onChange("stackBreakpoint", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select breakpoint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small (640px)</SelectItem>
                  <SelectItem value="md">Medium (768px)</SelectItem>
                  <SelectItem value="lg">Large (1024px)</SelectItem>
                  <SelectItem value="xl">Extra Large (1280px)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Items will stack vertically below this breakpoint and display in a row above it.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Get containers for the flex block
const getFlexContainers = (block: Block): ChildContainer[] => {
  // If containers already exist, return them
  if (block.containers && block.containers.length > 0) {
    return block.containers
  }

  // Otherwise, create a default container
  return [
    {
      id: `${block.id}-flex-container`,
      type: "flex-container",
      children: block.children || [],
    },
  ]
}

// Export the flex block definition
export const flexBlock: BlockDefinition = {
  type: "flex",
  label: "Flex Container",
  icon: <LayoutIcon size={16} />,
  defaultProperties,
  render: FlexRenderer,
  propertyEditor: (props) => <FlexPropertyEditor {...props} />,
  canHaveChildren: true,
  getContainers: getFlexContainers,
}

export default flexBlock
