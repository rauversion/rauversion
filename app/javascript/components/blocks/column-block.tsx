"use client"

import React from "react"
import type { ColumnBlock as ColumnBlockType, Block, BlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { BlockRenderer } from "./block-renderer"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, GripVertical, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { blockTypeLabels } from "@/lib/blocks/defaults"

interface ColumnBlockProps {
  block: ColumnBlockType
  isEditing?: boolean
  onSelectBlock?: (id: string) => void
  selectedBlockId?: string | null
  onUpdateChildren?: (children: Block[]) => void
  onAddChildBlock?: (columnIndex: number, blockType: BlockType) => void
  onRemoveChildBlock?: (blockId: string) => void
  // This should be the same updateBlockProps that handles recursive updates
  onUpdateChildProps?: (id: string, props: Record<string, unknown>) => void
}

// Sortable item for blocks inside columns
function SortableColumnItem({
  block,
  isSelected,
  selectedBlockId,
  onSelect,
  onRemove,
  onUpdateProps,
}: {
  block: Block
  isSelected: boolean
  selectedBlockId?: string | null
  onSelect?: (id: string) => void
  onRemove?: (id: string) => void
  onUpdateProps?: (id: string, props: Record<string, unknown>) => void
}) {
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
        "relative group",
        isDragging && "opacity-50",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(block.id)
      }}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col gap-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded bg-muted hover:bg-muted-foreground/20 cursor-grab"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(block.id)
            }}
            className="p-1 rounded bg-destructive/10 hover:bg-destructive/20"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        )}
      </div>
      <BlockRenderer
        block={block}
        isEditing={true}
        isSelected={isSelected}
        selectedBlockId={selectedBlockId}
        onSelect={onSelect}
        onUpdateProps={onUpdateProps}
      />
    </div>
  )
}

// Droppable column container
function DroppableColumn({
  columnIndex,
  children,
  blocks,
  isEditing,
  selectedBlockId,
  onSelectBlock,
  onRemoveChildBlock,
  onAddChildBlock,
  onUpdateChildProps,
}: {
  columnIndex: number
  children: Block[]
  blocks: Block[]
  isEditing?: boolean
  selectedBlockId?: string | null
  onSelectBlock?: (id: string) => void
  onRemoveChildBlock?: (id: string) => void
  onAddChildBlock?: (columnIndex: number, blockType: BlockType) => void
  onUpdateChildProps?: (blockId: string, props: Record<string, unknown>) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnIndex}`,
    data: { columnIndex },
  })

  const blockIds = blocks.map((b) => b.id)
  const availableBlockTypes: BlockType[] = [
    "text",
    "image",
    "card",
    "playlist",
    "track",
    "custom-player",
    "link-embed",
    "spacer",
  ]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] rounded-lg transition-colors p-2",
        isEditing && "border-2 border-dashed",
        isOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25",
        blocks.length === 0 && isEditing && "flex flex-col items-center justify-center"
      )}
    >
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {blocks.map((block) => (
            <SortableColumnItem
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              selectedBlockId={selectedBlockId}
              onSelect={onSelectBlock}
              onRemove={onRemoveChildBlock}
              onUpdateProps={onUpdateChildProps}
            />
          ))}
        </div>
      </SortableContext>

      {isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full mt-2 border border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5",
                blocks.length === 0 && "mt-0"
              )}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir bloque
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            {availableBlockTypes.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onAddChildBlock?.(columnIndex, type)}
              >
                {blockTypeLabels[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export function ColumnBlock({
  block,
  isEditing,
  onSelectBlock,
  selectedBlockId,
  onUpdateChildren,
  onAddChildBlock,
  onRemoveChildBlock,
  onUpdateChildProps,
}: ColumnBlockProps) {
  const { columns, gap } = block.props
  const allChildren = block.children || []
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

  const columnsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns]

  const gapClass = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }[gap]

  // Distribute children across columns
  const childrenPerColumn: Block[][] = Array.from({ length: columns }, () => [])
  allChildren.forEach((child, index) => {
    const columnIndex = index % columns
    childrenPerColumn[columnIndex].push(child)
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !onUpdateChildren) return

    const activeIndex = allChildren.findIndex((b) => b.id === active.id)
    if (activeIndex === -1) return

    // Check if dropping on a column
    if (String(over.id).startsWith("column-")) {
      const targetColumnIndex = parseInt(String(over.id).split("-")[1])
      // Move block to the end of target column
      const newChildren = [...allChildren]
      const [movedBlock] = newChildren.splice(activeIndex, 1)
      
      // Calculate new position based on column
      let insertIndex = 0
      for (let i = 0; i <= targetColumnIndex; i++) {
        insertIndex += childrenPerColumn[i]?.length || 0
      }
      
      newChildren.splice(insertIndex, 0, movedBlock)
      onUpdateChildren(newChildren)
      return
    }

    // Check if dropping on another block
    const overIndex = allChildren.findIndex((b) => b.id === over.id)
    if (overIndex === -1 || activeIndex === overIndex) return

    const newChildren = [...allChildren]
    const [movedBlock] = newChildren.splice(activeIndex, 1)
    newChildren.splice(overIndex, 0, movedBlock)
    onUpdateChildren(newChildren)
  }

  const activeBlock = activeId
    ? allChildren.find((b) => b.id === activeId)
    : null

  // Preview mode - simple render
  if (!isEditing) {
    return (
      <div className={cn("grid", columnsClass, gapClass)}>
        {childrenPerColumn.map((columnBlocks, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2">
            {columnBlocks.map((child) => (
              <BlockRenderer
                key={child.id}
                block={child}
                isEditing={false}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Edit mode with DnD
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("grid", columnsClass, gapClass)}>
        {childrenPerColumn.map((columnBlocks, colIndex) => (
          <DroppableColumn
            key={colIndex}
            columnIndex={colIndex}
            children={columnBlocks}
            blocks={columnBlocks}
            isEditing={isEditing}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            onRemoveChildBlock={onRemoveChildBlock}
            onAddChildBlock={onAddChildBlock}
            onUpdateChildProps={onUpdateChildProps}
          />
        ))}
      </div>

      <DragOverlay>
        {activeBlock && (
          <div className="opacity-80 shadow-lg">
            <BlockRenderer block={activeBlock} isEditing={false} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
