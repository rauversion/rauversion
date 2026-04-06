"use client"

import React from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useState } from "react"
import type { Block, BlockType, PageStyle } from "@/lib/blocks/types"
import { SortableBlock } from "./sortable-block"
import { getBlockEntry } from "@/lib/blocks/registry"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

interface EditorCanvasProps {
  blocks: Block[]
  selectedBlockId: string | null
  style: PageStyle
  onSelectBlock: (id: string | null) => void
  onMoveBlock: (oldIndex: number, newIndex: number) => void
  onAddBlock: (type: BlockType, index?: number) => void
  onDuplicateBlock: (id: string) => void
  onRemoveBlock: (id: string) => void
  onUpdateProps: (id: string, props: Record<string, unknown>) => void
  onUpdateColumnChildren?: (blockId: string, children: Block[]) => void
  onAddChildBlock?: (blockId: string, columnIndex: number, blockType: BlockType) => void
  onRemoveChildBlock?: (blockId: string, childId: string) => void
  onUpdateCarouselSlides?: (blockId: string, slides: import("@/lib/blocks/types").CarouselSlide[]) => void
}

export function EditorCanvas({
  blocks,
  selectedBlockId,
  style,
  onSelectBlock,
  onMoveBlock,
  onAddBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onUpdateProps,
  onUpdateColumnChildren,
  onAddChildBlock,
  onRemoveChildBlock,
  onUpdateCarouselSlides,
}: EditorCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Handle drag from palette
    if (active.data.current?.type === "palette") {
      const blockType = active.data.current.blockType as BlockType
      const overIndex = blocks.findIndex((b) => b.id === over.id)
      onAddBlock(blockType, overIndex >= 0 ? overIndex : undefined)
      return
    }

    // Handle reordering
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        onMoveBlock(oldIndex, newIndex)
      }
    }
  }

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : null

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectBlock(null)
    }
  }

  const fontClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[style.fontFamily]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 p-6 overflow-auto"
        onClick={handleCanvasClick}
        data-template={style.template}
        style={
          {
            "--color-primary": style.primaryColor,
            "--primary": style.primaryColor,
          } as React.CSSProperties
        }
      >
        <div className={cn("max-w-3xl mx-auto", fontClass)}>
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted-foreground/25 rounded-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                Comienza a crear tu pagina
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Arrastra bloques desde la paleta o haz clic en ellos para
                añadirlos a tu pagina
              </p>
            </div>
          ) : (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 pl-10 pr-10">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    pageStyle={style}
                    isSelected={selectedBlockId === block.id}
                    selectedBlockId={selectedBlockId}
                    onSelect={onSelectBlock}
                    onDuplicate={onDuplicateBlock}
                    onRemove={onRemoveBlock}
                    onUpdateProps={onUpdateProps}
                    onUpdateColumnChildren={onUpdateColumnChildren}
                    onAddChildBlock={onAddChildBlock}
                    onRemoveChildBlock={onRemoveChildBlock}
                    onUpdateCarouselSlides={onUpdateCarouselSlides}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeBlock && (
          <div className="opacity-80 pointer-events-none">
            <div className="p-4 rounded-lg border bg-card shadow-lg">
              <span className="text-sm font-medium">
                {getBlockEntry(activeBlock.type)?.label || activeBlock.type}
              </span>
            </div>
          </div>
        )}
        {activeId?.startsWith("palette-") && (
          <div className="p-4 rounded-lg border bg-card shadow-lg">
            <span className="text-sm font-medium">
              {getBlockEntry(activeId.replace("palette-", "") as BlockType)?.label}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
