"use client"
import React from "react"

import { NotebookTabsIcon as TabsIcon } from "lucide-react"
import type { Block, BlockDefinition, BlockRendererProps, ChildContainer, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBlocks } from "../block-context"
import { BlockRenderer } from "../block-renderer"
import { usePageBuilder } from "../page-builder"
import { useState, useCallback } from "react"
import { Plus, Trash2, MoveHorizontal } from "lucide-react"
import { DroppableArea } from "../droppable-area"
import { createTabs } from "./registry"


// Create a separate component for the property editor to properly manage hooks
function TabsPropertyEditor({ properties, onChange }: PropertyEditorProps) {
  // Get tab titles from properties
  const tabTitles = properties.tabTitles || ["Tab 1", "Tab 2"]
  const tabCount = properties.tabCount || 2

  const [activeTabIndex, setActiveTabIndex] = useState(0)

  const handleAddTab = useCallback(() => {
    const newTabTitles = [...tabTitles, `Tab ${tabTitles.length + 1}`]
    onChange("tabTitles", newTabTitles)
    onChange("tabCount", tabCount + 1)

    // Set the new tab as active
    setActiveTabIndex(newTabTitles.length - 1)
  }, [tabTitles, tabCount, onChange])

  const handleRemoveTab = useCallback(
    (index: number) => {
      if (tabCount <= 1) return // Don't remove the last tab

      const updatedTitles = [...tabTitles]
      updatedTitles.splice(index, 1)
      onChange("tabTitles", updatedTitles)
      onChange("tabCount", tabCount - 1)

      // Adjust active tab if needed
      if (activeTabIndex >= updatedTitles.length) {
        setActiveTabIndex(Math.max(0, updatedTitles.length - 1))
      }
    },
    [tabTitles, tabCount, onChange, activeTabIndex],
  )

  const handleTabTitleChange = useCallback(
    (index: number, title: string) => {
      const updatedTitles = [...tabTitles]
      updatedTitles[index] = title
      onChange("tabTitles", updatedTitles)
    },
    [tabTitles, onChange],
  )

  const handleMoveTab = useCallback(
    (index: number, direction: "left" | "right") => {
      if ((direction === "left" && index === 0) || (direction === "right" && index === tabTitles.length - 1)) {
        return // Can't move beyond boundaries
      }

      const newIndex = direction === "left" ? index - 1 : index + 1
      const updatedTitles = [...tabTitles]
      const tabToMove = updatedTitles[index]

      // Remove tab from current position
      updatedTitles.splice(index, 1)
      // Insert at new position
      updatedTitles.splice(newIndex, 0, tabToMove)

      onChange("tabTitles", updatedTitles)
      setActiveTabIndex(newIndex)
    },
    [tabTitles, onChange],
  )

  return (
    <div className="space-y-6">
      {/* General tab settings */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="tabs-variant">Variant</Label>
          <Select value={properties.variant || "default"} onValueChange={(value) => onChange("variant", value)}>
            <SelectTrigger id="tabs-variant">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="underlined">Underlined</SelectItem>
              <SelectItem value="pills">Pills</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tabs-alignment">Alignment</Label>
          <Select value={properties.alignment || "start"} onValueChange={(value) => onChange("alignment", value)}>
            <SelectTrigger id="tabs-alignment">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Start</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="end">End</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tabs-default">Default Tab</Label>
          <Select value={properties.defaultTab || "0"} onValueChange={(value) => onChange("defaultTab", value)}>
            <SelectTrigger id="tabs-default">
              <SelectValue placeholder="Select default tab" />
            </SelectTrigger>
            <SelectContent>
              {tabTitles.map((title, index) => (
                <SelectItem key={index} value={String(index)}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Manage Tabs</h3>
          <Button variant="outline" size="sm" onClick={handleAddTab} className="flex items-center gap-1">
            <Plus size={14} />
            Add Tab
          </Button>
        </div>

        <div className="space-y-2">
          {tabTitles.map((title, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => handleTabTitleChange(index, e.target.value)}
                placeholder="Tab title"
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveTab(index, "left")}
                  disabled={index === 0}
                  className="h-8 w-8"
                >
                  <MoveHorizontal size={14} className="rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveTab(index, "right")}
                  disabled={index === tabTitles.length - 1}
                  className="h-8 w-8"
                >
                  <MoveHorizontal size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTab(index)}
                  disabled={tabTitles.length <= 1}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const tabsBlock: BlockDefinition = {
  type: "tabs",
  label: "Tabs",
  icon: <TabsIcon size={16} />,
  defaultProperties: {
    variant: "default",
    alignment: "start",
    defaultTab: "0",
    tabTitles: ["Tab 1", "Tab 2"],
    tabCount: 2,
  },

  // Add the getContainers function
  getContainers: (block: Block): ChildContainer[] => {
    const tabTitles = block.properties.tabTitles || ["Tab 1", "Tab 2"]
    const tabCount = block.properties.tabCount || 2

    // If containers already exist and count matches, return them
    if (block.containers && block.containers.length === tabCount) {
      // Update titles if needed
      return block.containers.map((container, index) => ({
        ...container,
        title: tabTitles[index] || `Tab ${index + 1}`,
      }))
    }

    // Otherwise create new containers
    return createTabs(tabCount, tabTitles)
  },

  render: ({ block, isSelected, onSelect, isChild, parentId }: BlockRendererProps) => {
    const { debug, moveBlock, addBlock } = useBlocks()
    const { selectedBlockId } = usePageBuilder()
    const [activeTab, setActiveTab] = useState(block.properties.defaultTab || "0")

    // Extract properties with defaults
    const variant = block.properties.variant || "default"
    const alignment = block.properties.alignment || "start"

    // Get tab containers
    const tabContainers = block.containers || []

    // Handle drop on a tab
    const handleTabDrop = (tabId: string, item: any) => {
      if (item.id) {
        // Move existing block
        moveBlock(item.id, tabId, "tab")
      } else if (item.type) {
        // Add new block from palette
        const newBlockId = addBlock(item.type)
        moveBlock(newBlockId, tabId, "tab")
      }
    }

    return (
      <div
        className={cn("w-full rounded-md border p-4", debug && "outline outline-2 outline-orange-500")}
        data-tabs-id={block.id}
        data-parent-id={parentId || "none"}
        onClick={(e) => {
          // Prevent click from propagating to parent elements
          e.stopPropagation()
          onSelect()
        }}
      >
        {debug && <div className="mb-2 text-xs text-muted-foreground">Tabs Block ID: {block.id}</div>}

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={cn("w-full", alignment === "center" && "justify-center", alignment === "end" && "justify-end")}
          >
            {tabContainers.map((container, index) => (
              <TabsTrigger key={container.id} value={String(index)}>
                {container.title || `Tab ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabContainers.map((container, index) => (
            <TabsContent key={container.id} value={String(index)} className="mt-2">
              <DroppableArea
                id={container.id}
                type="cell"
                className="p-4 border border-dashed"
                onDrop={(item) => handleTabDrop(container.id, item)}
                isEmpty={!container.children || container.children.length === 0}
                emptyContent={debug ? `Tab ID: ${container.id}` : "Drop blocks here"}
              >
                {container.children && container.children.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {container.children.map((childBlock) => (
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
                        containerId={container.id}
                        containerType="cell"
                      />
                    ))}
                  </div>
                )}
              </DroppableArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  },

  // Use the separate component for property editing to properly manage hooks
  propertyEditor: (props: PropertyEditorProps) => <TabsPropertyEditor {...props} />,
}
