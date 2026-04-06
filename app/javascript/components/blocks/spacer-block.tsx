"use client"

import React from "react"
import type { SpacerBlock as SpacerBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface SpacerBlockProps {
  block: SpacerBlockType
  isEditing?: boolean
}

export function SpacerBlock({ block, isEditing }: SpacerBlockProps) {
  const heightClass = {
    sm: "h-4",
    md: "h-8",
    lg: "h-16",
    xl: "h-24",
  }[block.props.height]

  return (
    <div
      className={cn(
        heightClass,
        isEditing && "border border-dashed border-muted-foreground/30 rounded bg-muted/20"
      )}
    />
  )
}
