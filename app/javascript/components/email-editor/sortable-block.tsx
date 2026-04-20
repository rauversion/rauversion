"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Copy, GripVertical, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmailBlockRenderer } from "./email-block-renderer"
import type { EmailBlock, EmailTheme } from "@/lib/email-editor/types"
import { cn } from "@/lib/utils"

interface SortableEmailBlockProps {
  block: EmailBlock
  theme: EmailTheme
  isSelected: boolean
  onSelect: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

export function SortableEmailBlock({
  block,
  theme,
  isSelected,
  onSelect,
  onDuplicate,
  onRemove,
}: SortableEmailBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative rounded-2xl transition-all", isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background", isDragging && "opacity-90 shadow-lg")}
    >
      <div className={cn("absolute -left-10 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100", isSelected && "opacity-100")}>
        <button
          type="button"
          className="rounded-md p-1.5 hover:bg-muted"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className={cn("absolute -right-2 top-1/2 flex -translate-y-1/2 translate-x-full flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100", isSelected && "opacity-100")}>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(block.id)}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onRemove(block.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div onClick={() => onSelect(block.id)} className="cursor-pointer rounded-2xl border border-border/60 bg-card p-4">
        <EmailBlockRenderer block={block} theme={theme} isEditing={true} />
      </div>
    </div>
  )
}
