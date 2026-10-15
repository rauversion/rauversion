import React from "react"
import { cn } from "@/lib/utils"

interface EventDescriptionProps {
  description?: string
  html?: string
  className?: string
  style?: React.CSSProperties
}

export function EventDescription({ description, html, className, style }: EventDescriptionProps) {
  if (html !== undefined) {
    if (!html.trim()) return null

    return (
      <div
        className={cn("prose prose-neutral dark:prose-invert max-w-none break-words", className)}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  if (!description?.trim()) return null

  return <div className={cn("whitespace-pre-line break-words", className)} style={style}>{description}</div>
}
