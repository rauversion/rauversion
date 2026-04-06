"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Block, BlockType, PageStyle } from "@/lib/blocks/types"
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { cn } from "@/lib/utils"
import { GripVertical, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SortableBlockProps {
  block: Block
  pageStyle: PageStyle
  isSelected: boolean
  selectedBlockId: string | null
  onSelect: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onUpdateProps: (id: string, props: Record<string, unknown>) => void
  onUpdateColumnChildren?: (blockId: string, children: Block[]) => void
  onAddChildBlock?: (blockId: string, columnIndex: number, blockType: BlockType) => void
  onRemoveChildBlock?: (blockId: string, childId: string) => void
  onUpdateCarouselSlides?: (blockId: string, slides: import("@/lib/blocks/types").CarouselSlide[]) => void
}

export function SortableBlock({
  block,
  pageStyle,
  isSelected,
  selectedBlockId,
  onSelect,
  onDuplicate,
  onRemove,
  onUpdateProps,
  onUpdateColumnChildren,
  onAddChildBlock,
  onRemoveChildBlock,
  onUpdateCarouselSlides,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg transition-all",
        isDragging && "z-50 opacity-90 shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Drag handle and actions */}
      <div
        className={cn(
          "absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}
      >
        <button
          className="p-1.5 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Block actions on hover */}
      <div
        className={cn(
          "absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDuplicate(block.id)}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onRemove(block.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Block content */}
      <div onClick={() => onSelect(block.id)} className="cursor-pointer">
        <BlockRenderer
          block={block}
          pageStyle={pageStyle}
          isEditing={true}
          isSelected={isSelected}
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
          onUpdateProps={onUpdateProps}
          onUpdateChildren={onUpdateColumnChildren}
          onAddChildBlock={onAddChildBlock}
          onRemoveChildBlock={onRemoveChildBlock}
          onUpdateCarouselSlides={onUpdateCarouselSlides}
        />
      </div>
    </div>
  )
}
