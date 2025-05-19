"use client"

import React from "react"

import { GridIcon, Plus, Minus, Smartphone, Tablet, Monitor } from "lucide-react"
import type { Block, BlockDefinition, BlockRendererProps, ChildContainer, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useBlocks } from "../block-context"
import { usePageBuilder } from "../page-builder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DroppableArea } from "../droppable-area"
import { BlockRenderer } from "../block-renderer"
import { createGridCells } from "./registry"

// Define the responsive breakpoints
const breakpoints = [
  { id: "base", label: "Mobile", icon: <Smartphone size={16} /> },
  { id: "sm", label: "Tablet", icon: <Tablet size={16} /> },
  { id: "md", label: "Desktop", icon: <Monitor size={16} /> },
]

// Define column options for the grid
const columnOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// Define gap options
const gapOptions = [
  { value: "0", label: "None" },
  { value: "1", label: "XS (0.25rem)" },
  { value: "2", label: "SM (0.5rem)" },
  { value: "4", label: "MD (1rem)" },
  { value: "6", label: "LG (1.5rem)" },
  { value: "8", label: "XL (2rem)" },
  { value: "12", label: "2XL (3rem)" },
  { value: "16", label: "3XL (4rem)" },
]

// Create a separate component for the grid property editor to properly manage hooks
function GridPropertyEditor({ properties, onChange }: PropertyEditorProps) {
  const [activeBreakpoint, setActiveBreakpoint] = React.useState("base")
  const { debug } = useBlocks()

  // Initialize columns object if it doesn't exist
  const columns = properties.columns || { base: 1, sm: 2, md: 3 }

  const handleColumnsChange = (breakpoint: string, value: number) => {
    const newColumns = { ...columns, [breakpoint]: value }
    onChange("columns", newColumns)

    // Ensure we have enough cells for the maximum number of columns
    const maxColumns = Math.max(...Object.values(newColumns))
    const currentCellCount = properties.cellCount || 0

    if (currentCellCount < maxColumns) {
      onChange("cellCount", maxColumns)
    }
  }

  const handleAddGridColumn = () => {
    const currentColumns = columns[activeBreakpoint] || 1
    if (currentColumns >= 12) return // Max 12 columns

    handleColumnsChange(activeBreakpoint, currentColumns + 1)
  }

  const handleRemoveGridColumn = () => {
    const currentColumns = columns[activeBreakpoint] || 1
    if (currentColumns <= 1) return // Min 1 column

    handleColumnsChange(activeBreakpoint, currentColumns - 1)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="base" value={activeBreakpoint} onValueChange={setActiveBreakpoint}>
        <TabsList className="w-full">
          {breakpoints.map((breakpoint) => (
            <TabsTrigger key={breakpoint.id} value={breakpoint.id} className="flex items-center gap-1">
              {breakpoint.icon}
              <span className="hidden sm:inline">{breakpoint.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {breakpoints.map((breakpoint) => (
          <TabsContent key={breakpoint.id} value={breakpoint.id} className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor={`grid-columns-${breakpoint.id}`}>Columns</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRemoveGridColumn}
                    disabled={columns[breakpoint.id] <= 1}
                  >
                    <Minus size={12} />
                  </Button>
                  <span className="text-sm text-muted-foreground">{columns[breakpoint.id] || 1}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleAddGridColumn}
                    disabled={columns[breakpoint.id] >= 12}
                  >
                    <Plus size={12} />
                  </Button>
                </div>
              </div>
              <Select
                value={String(columns[breakpoint.id] || 1)}
                onValueChange={(value) => handleColumnsChange(breakpoint.id, Number(value))}
              >
                <SelectTrigger id={`grid-columns-${breakpoint.id}`}>
                  <SelectValue placeholder="Select columns" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} {option === 1 ? "column" : "columns"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div>
        <Label htmlFor="grid-gap">Gap</Label>
        <Select value={properties.gap || "4"} onValueChange={(value) => onChange("gap", value)}>
          <SelectTrigger id="grid-gap">
            <SelectValue placeholder="Select gap" />
          </SelectTrigger>
          <SelectContent>
            {gapOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="grid-padding">Padding</Label>
        <Select value={properties.padding || "4"} onValueChange={(value) => onChange("padding", value)}>
          <SelectTrigger id="grid-padding">
            <SelectValue placeholder="Select padding" />
          </SelectTrigger>
          <SelectContent>
            {gapOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="grid-border"
          checked={properties.border || false}
          onCheckedChange={(checked) => onChange("border", checked)}
        />
        <Label htmlFor="grid-border">Show Border</Label>
      </div>
    </div>
  )
}

// Create a separate component for grid cells
function GridCell({ container, gridId, selectedBlockId, parentId, colSpan, isPreview }) {
  const { debug, moveBlock, addBlock } = useBlocks()

  // Build column span classes
  const colSpanClasses = cn(
    // Base column span (mobile)
    colSpan?.base && `col-span-${colSpan.base}`,
    // Responsive column spans
    colSpan?.sm && `sm:col-span-${colSpan.sm}`,
    colSpan?.md && `md:col-span-${colSpan.md}`,
    colSpan?.lg && `lg:col-span-${colSpan.lg}`,
    colSpan?.xl && `xl:col-span-${colSpan.xl}`,
  )

  // Handle drop on a cell
  const handleCellDrop = (item: any) => {
    if (item.id) {
      // Move existing block
      moveBlock(item.id, container.id, "cell")
    } else if (item.type) {
      // Add new block from palette
      const newBlockId = addBlock(item.type)
      moveBlock(newBlockId, container.id, "cell")
    }
  }

  return (
    <div className={colSpanClasses}>
      {!isPreview ? (
        <DroppableArea
          id={container.id}
          type="cell"
          className="min-h-[100px] p-2 border border-dashed"
          onDrop={handleCellDrop}
          isEmpty={!container.children || container.children.length === 0}
          emptyContent={debug ? `Cell ID: ${container.id}` : "Drop blocks here"}
        >
          {container.children && container.children.length > 0 && (
            <div className="flex flex-col gap-2">
              {container.children.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => {
                    // When a block in a cell is clicked, select that block
                    if (typeof window !== "undefined") {
                      const event = new CustomEvent("selectBlock", { detail: { blockId: block.id } })
                      window.dispatchEvent(event)
                    }
                  }}
                  isChild={true}
                  parentId={gridId}
                  containerId={container.id}
                  containerType="cell"
                />
              ))}
            </div>
          )}
        </DroppableArea>
      ) : (
        container.children && container.children.length > 0 && (
          <div className="flex flex-col gap-2">
            {container.children.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                onSelect={() => {
                  if (typeof window !== "undefined") {
                    const event = new CustomEvent("selectBlock", { detail: { blockId: block.id } })
                    window.dispatchEvent(event)
                  }
                }}
                isChild={true}
                parentId={gridId}
                containerId={container.id}
                containerType="cell"
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

export const gridBlock: BlockDefinition = {
  type: "grid",
  label: "Grid",
  icon: <GridIcon size={16} />,
  defaultProperties: {
    columns: {
      base: 1, // Mobile (default)
      sm: 2, // Tablet (640px+)
      md: 3, // Desktop (768px+)
    },
    gap: "4",
    rowGap: "",
    columnGap: "",
    padding: "4",
    background: "transparent",
    border: false,
    cellCount: 3,
  },

  // Add the getContainers function
  getContainers: (block: Block): ChildContainer[] => {
    const cellCount = block.properties.cellCount || 3

    // If containers already exist, return them
    if (block.containers && block.containers.length === cellCount) {
      return block.containers
    }

    // Otherwise create new containers
    return createGridCells(cellCount)
  },

  render: ({ block, isSelected, onSelect, isChild, parentId, isPreview }: BlockRendererProps) => {
    const { debug } = useBlocks()
    const { selectedBlockId } = usePageBuilder()

    // Extract properties with defaults
    const columns = block.properties.columns || { base: 1, sm: 2, md: 3 }
    const gap = block.properties.gap || "4"
    const rowGap = block.properties.rowGap || ""
    const columnGap = block.properties.columnGap || ""
    const padding = block.properties.padding || "4"
    const background = block.properties.background || "transparent"
    const border = block.properties.border || false

    // Build Tailwind grid classes
    const gridClasses = cn(
      "grid w-full",
      // Base columns (mobile)
      `grid-cols-${columns.base}`,
      // Responsive columns
      columns.sm && `sm:grid-cols-${columns.sm}`,
      columns.md && `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`,
      columns.xl && `xl:grid-cols-${columns.xl}`,
      // Gap
      gap && `gap-${gap}`,
      // Specific row and column gaps (if provided)
      rowGap && `row-gap-${rowGap}`,
      columnGap && `column-gap-${columnGap}`,
    )

    // Get cell containers
    const cellContainers = block.containers || []

    return (
      <div
        className={cn(
          "w-full rounded-md",
          border && "border",
          debug && "outline outline-2 outline-blue-500",
          `p-${padding}`,
          "hover:border-primary/50 hover:bg-muted/10",
        )}
        style={{
          background,
        }}
        data-grid-id={block.id}
        data-parent-id={parentId || "none"}
        onClick={(e) => {
          // Prevent click from propagating to parent elements
          e.stopPropagation()
          onSelect()
        }}
      >
        <div className={gridClasses}>
          {cellContainers.length > 0 ? (
            cellContainers.map((container, index) => (
              <GridCell
                key={container.id}
                container={container}
                gridId={block.id}
                selectedBlockId={selectedBlockId}
                parentId={parentId}
                colSpan={{
                  base: index < columns.base ? 1 : columns.base,
                  sm: index < columns.sm ? 1 : columns.sm,
                  md: index < columns.md ? 1 : columns.md,
                }}
                isPreview={!!isPreview}
              />
            ))

          ) : (
            <div
              className={cn(
                "col-span-full flex min-h-[100px] w-full items-center justify-center rounded-md- border-2- border-dashed- p-4 text-sm text-muted-foreground",
                "border-muted-foreground/20",
              )}
            >
              No grid cells defined
            </div>
          )}
        </div>
      </div>
    )
  },

  // Use the separate component for property editing to properly manage hooks
  propertyEditor: (props: PropertyEditorProps) => <GridPropertyEditor {...props} />,
}
