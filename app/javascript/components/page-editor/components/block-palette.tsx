"use client"

import React from "react"
import { useDraggable } from "@dnd-kit/core"
import { blocksByCategory, type BlockRegistryEntry } from "@/lib/blocks/registry"
import type { BlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface DraggableBlockItemProps {
  entry: BlockRegistryEntry
  onAdd: (type: BlockType) => void
}

function DraggableBlockItem({ entry, onAdd }: DraggableBlockItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${entry.type}`,
    data: {
      type: "palette",
      blockType: entry.type,
    },
  })

  const Icon = entry.icon

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAdd(entry.type)}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left",
        isDragging && "opacity-50 cursor-grabbing"
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {entry.description}
        </p>
      </div>
    </button>
  )
}

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Contenido
        </h3>
        <div className="space-y-2">
          {blocksByCategory.content.map((entry) => (
            <DraggableBlockItem
              key={entry.type}
              entry={entry}
              onAdd={onAddBlock}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Media
        </h3>
        <div className="space-y-2">
          {blocksByCategory.media.map((entry) => (
            <DraggableBlockItem
              key={entry.type}
              entry={entry}
              onAdd={onAddBlock}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Layout
        </h3>
        <div className="space-y-2">
          {blocksByCategory.layout.map((entry) => (
            <DraggableBlockItem
              key={entry.type}
              entry={entry}
              onAdd={onAddBlock}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
