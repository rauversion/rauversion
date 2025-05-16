"use client"
import React from "react"

import { useState } from "react"
import { getAllBlockTypes } from "./blocks/registry"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
// dnd-kit version of a single draggable block in the palette
import { useDraggable } from "@dnd-kit/core"

interface DraggableBlockItemProps {
  type: string
  label: string
  icon: React.ReactNode
}

function DraggableBlockItem({ type, label, icon }: DraggableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-md border bg-background p-3 shadow-sm transition-all hover:border-primary/50 hover:bg-muted",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

// Main block palette component
export function BlockPalette() {
  const [searchQuery, setSearchQuery] = useState("")
  const blockTypes = getAllBlockTypes()

  // Filter blocks based on search query
  const filteredBlocks = blockTypes.filter(
    (block) => block.label && block.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search blocks..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filteredBlocks.length > 0 ? (
          filteredBlocks.map((block) => (
            <DraggableBlockItem key={block.type} type={block.type} label={block.label} icon={block.icon} />
          ))
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">No blocks found</div>
        )}
      </div>
    </div>
  )
}
