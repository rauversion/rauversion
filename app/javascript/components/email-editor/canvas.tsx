"use client"

import React, { useMemo, useState } from "react"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"

import type { EmailBlock, EmailTheme } from "@/lib/email-editor/types"
import { SortableEmailBlock } from "./sortable-block"
import { getEmailBlockEntry } from "@/lib/email-editor/registry"

interface EmailCanvasProps {
  blocks: EmailBlock[]
  theme: EmailTheme
  selectedBlockId: string | null
  onMoveBlock: (oldIndex: number, newIndex: number) => void
  onSelectBlock: (id: string | null) => void
  onDuplicateBlock: (id: string) => void
  onRemoveBlock: (id: string) => void
}

export function EmailCanvas({
  blocks,
  theme,
  selectedBlockId,
  onMoveBlock,
  onSelectBlock,
  onDuplicateBlock,
  onRemoveBlock,
}: EmailCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const activeBlock = useMemo(
    () => (activeId ? blocks.find((block) => block.id === activeId) : null),
    [activeId, blocks]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)

    if (!event.over || event.active.id === event.over.id) return

    const oldIndex = blocks.findIndex((block) => block.id === event.active.id)
    const newIndex = blocks.findIndex((block) => block.id === event.over?.id)
    if (oldIndex >= 0 && newIndex >= 0) {
      onMoveBlock(oldIndex, newIndex)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-auto bg-muted/20 p-6" onClick={(event) => event.target === event.currentTarget && onSelectBlock(null)}>
        <div className="mx-auto max-w-3xl space-y-4">
          {blocks.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-border bg-card px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Comienza a componer tu email</h3>
              <p className="mt-2 text-sm text-muted-foreground">Agrega bloques desde la paleta para construir el correo.</p>
            </div>
          ) : (
            <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableEmailBlock
                  key={block.id}
                  block={block}
                  theme={theme}
                  isSelected={selectedBlockId === block.id}
                  onSelect={onSelectBlock}
                  onDuplicate={onDuplicateBlock}
                  onRemove={onRemoveBlock}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeBlock ? (
          <div className="rounded-xl border bg-card p-4 shadow-xl">
            <span className="text-sm font-medium">{getEmailBlockEntry(activeBlock.type)?.label || activeBlock.type}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
