"use client"
import React from "react"

import type { ReactNode } from "react"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { useBlocks } from "./block-context"

interface DroppableAreaProps {
  id: string
  type: "children" | "cell" | "tab" | string
  children: ReactNode
  className?: string
  onDrop?: (item: any) => void
  emptyContent?: ReactNode
  isEmpty?: boolean
}

/**
 * A generic droppable area component that can be used by any block type
 * to create a drop zone for other blocks.
 */
export function DroppableArea({
  id,
  type,
  children,
  className,
  onDrop,
  emptyContent,
  isEmpty = false,
}: DroppableAreaProps) {
  const { debug } = useBlocks();

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type, id },
  });

  // dnd-kit does not provide canDrop by default; assume true for now
  const canDrop = true;

  // dnd-kit handles drop at the DndContext level, so onDrop should be called from there.
  // For now, keep the prop for compatibility, but it will not be triggered here.

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] w-full rounded-md transition-colors",
        isOver && canDrop ? "border-primary bg-primary/5 py-8" : "border-muted-foreground/20",
        isEmpty ? "border-2 border-dashed" : "",
        className,
      )}
      data-droppable-id={id}
      data-droppable-type={type}
    >
      {isEmpty ? (
        <div className="flex h-full min-h-[100px] w-full items-center justify-center text-sm text-muted-foreground">
          {emptyContent || (debug ? `${type} ID: ${id}` : "Drop blocks here")}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
