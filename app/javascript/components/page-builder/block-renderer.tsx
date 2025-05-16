"use client"
import React from "react"

import type { Block } from "./blocks/types"
import { useBlocks } from "./block-context"
import { Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { renderBlock } from "./blocks/registry"
import { DraggableBlock } from "./draggable-block"
import { v4 as uuidv4 } from "uuid"
import { usePreviewOptions } from "./page-preview"

interface BlockRendererProps {
  block: Block
  isSelected: boolean
  onSelect: () => void
  isChild?: boolean
  parentId?: string
  containerId?: string
  containerType?: string
  isPreview?: boolean
}

export function BlockRenderer({
  block,
  isSelected,
  onSelect,
  isChild = false,
  parentId,
  containerId,
  containerType,
  isPreview,
}: BlockRendererProps) {
  const previewOptions = usePreviewOptions()
  isPreview = typeof isPreview === "boolean" ? isPreview : !!previewOptions.isPreview
  const { removeBlock, debug, addBlock, moveBlock } = useBlocks()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Function to duplicate a block
  const duplicateBlock = () => {
    // Deep clone the block
    const clonedBlock = JSON.parse(JSON.stringify(block))

    // Generate new IDs for the block and any nested elements
    const generateNewIds = (block) => {
      const newId = uuidv4()
      block.id = newId

      // Process children recursively
      if (block.children && block.children.length > 0) {
        block.children = block.children.map(generateNewIds)
      }

      // Process containers recursively
      if (block.containers && block.containers.length > 0) {
        block.containers = block.containers.map((container) => {
          container.id = uuidv4()
          if (container.children && container.children.length > 0) {
            container.children = container.children.map(generateNewIds)
          }
          return container
        })
      }

      return block
    }

    // Generate new IDs for the cloned block and all its nested elements
    generateNewIds(clonedBlock)

    // Add the cloned block
    const newBlockId = addBlock(block.type, clonedBlock.properties)

    // If the block has a container, add it to the same container
    if (containerId && containerType) {
      moveBlock(newBlockId, containerId, containerType)
    }

    if (debug) {
      console.log(`Duplicated block ${block.id} to ${newBlockId}`)
    }
  }

  if (isPreview) {
    // Clean preview: no drag, no controls, no border, no selection
    return (
      <div className="w-full overflow-hidden-">
        
        {renderBlock({
          block,
          isSelected: false,
          onSelect: () => {},
          isChild,
          parentId,
          containerId,
          containerType,
          isPreview: true,
        })}
      </div>
    )
  }

  // Editor mode: show drag, controls, borders, etc.
  return (
    <DraggableBlock
      id={block.id}
      type={block.type}
      isSelected={isSelected}
      parentId={parentId}
      containerId={containerId}
      containerType={containerType}
      onSelect={onSelect}
      className={cn(!isChild && "mb-4")}
    >
      <div
        className={cn(
          "absolute -right-10 top-0 flex h-full flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
          isSelected && "opacity-100",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation()
            duplicateBlock()
          }}
          title="Duplicate"
        >
          <Copy size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            removeBlock(block.id)
          }}
          title="Delete"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      {(block.children?.length > 0 || block.containers?.length > 0) && (
        <div
          className={cn(
            "absolute -left-10 top-0 flex h-full items-center opacity-0 transition-opacity group-hover:opacity-100",
            isSelected && "opacity-100",
          )}
          style={{ left: "-2.5rem" }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(!isCollapsed)
            }}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      )}

      <div
        className={cn(
          "w-full overflow-hidden rounded-md border p-2",
          isSelected && "border-primary",
          "group-hover:border-primary/50", // Highlight border on hover
        )}
        onClick={(e) => {
          // Ensure clicks on the content also select the block
          e.stopPropagation()
          if (typeof window !== "undefined") {
            const event = new CustomEvent("selectBlock", { detail: { blockId: block.id } })
            window.dispatchEvent(event)
          }
          onSelect()
        }}
      >
        {debug && (
          <div className="mb-1 text-xs text-muted-foreground">
            ID: {block.id} | Type: {block.type}
            {parentId && ` | Parent: ${parentId}`}
            {containerId && ` | Container: ${containerId}`}
            {containerType && ` | Container Type: ${containerType}`}
          </div>
        )}

        {!isCollapsed ? (
          renderBlock({
            block,
            isSelected,
            onSelect,
            isChild,
            parentId,
            containerId,
            containerType,
          })
        ) : (
          <div className="flex h-10 items-center px-2 text-sm text-muted-foreground">{block.type} (collapsed)</div>
        )}
      </div>
    </DraggableBlock>
  )
}
