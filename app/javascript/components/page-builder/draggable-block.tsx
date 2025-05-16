"use client"
import React from "react"

import type { ReactNode } from "react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

interface DraggableBlockProps {
  id: string
  type: string
  isSelected: boolean
  children: ReactNode
  className?: string
  parentId?: string
  containerId?: string
  containerType?: string
  onSelect: () => void
}

export function DraggableBlock({
  id,
  type,
  isSelected,
  children,
  className,
  parentId,
  containerId,
  containerType,
  onSelect,
}: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id,
    data: { id, type, parentId, containerId, containerType },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("relative group", isDragging && "opacity-50", isSelected && "z-10", className)}
      data-block-id={id}
      onClick={onSelect}
    >
      {children}
    </div>
  )
}
