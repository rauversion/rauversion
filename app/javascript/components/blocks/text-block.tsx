"use client"

import React from "react"
import type { TextBlock as TextBlockType, ProseSize } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { TiptapEditor } from "./tiptap-editor"

interface TextBlockProps {
  block: TextBlockType
  isEditing?: boolean
  onUpdate?: (props: { content?: string; alignment?: "left" | "center" | "right"; proseSize?: ProseSize }) => void
}

const proseSizeClasses: Record<ProseSize, string> = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
  xl: "prose-xl",
  "2xl": "prose-2xl",
}

export function TextBlock({ block, isEditing, onUpdate }: TextBlockProps) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[block.props.alignment]

  const proseSize = block.props.proseSize || "base"

  if (isEditing && onUpdate) {
    return (
      <TiptapEditor
        content={block.props.content}
        alignment={block.props.alignment}
        proseSize={proseSize}
        onUpdate={(content) => onUpdate({ content })}
        onAlignmentChange={(alignment) => onUpdate({ alignment })}
        placeholder="Escribe tu texto aqui..."
      />
    )
  }

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        proseSizeClasses[proseSize],
        alignmentClass
      )}
      dangerouslySetInnerHTML={{ __html: block.props.content }}
    />
  )
}
