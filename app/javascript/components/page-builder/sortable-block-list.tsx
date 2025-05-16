"use client"
import React from "react"
import { SortableContext } from "@dnd-kit/sortable"
import { SortableBlock } from "./sortable-block"
import { BlockRenderer } from "./block-renderer"
import { cn } from "@/lib/utils"

interface SortableBlockListProps {
  blocks: any[]
  direction?: "row" | "column"
  isPreview?: boolean
  selectedBlockId?: string
  parentId?: string
  containerId?: string
  containerType?: string
}

export function SortableBlockList({
  blocks,
  direction = "column",
  isPreview = false,
  selectedBlockId,
  parentId,
  containerId,
  containerType,
}: SortableBlockListProps) {
  if (!blocks || blocks.length === 0) return null

  const flexDirection = direction === "row" ? "flex-row" : "flex-col"

  if (isPreview) {
    return (
      <div className={cn("flex w-full gap-4", flexDirection)}>
        {blocks.map((childBlock) => (
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
            parentId={parentId}
            containerId={containerId}
            containerType={containerType}
          />
        ))}
      </div>
    )
  }

  return (
    <SortableContext items={blocks.map((b) => b.id)}>
      <div className={cn("flex w-full gap-4", flexDirection)}>
        {blocks.map((childBlock) => (
          <SortableBlock
            key={childBlock.id}
            id={childBlock.id}
            containerId={containerId}
            containerType={containerType}
          >
            <BlockRenderer
              block={childBlock}
              isSelected={selectedBlockId === childBlock.id}
              onSelect={() => {
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                  window.dispatchEvent(event)
                }
              }}
              isChild={true}
              parentId={parentId}
              containerId={containerId}
              containerType={containerType}
            />
          </SortableBlock>
        ))}
      </div>
    </SortableContext>
  )
}
