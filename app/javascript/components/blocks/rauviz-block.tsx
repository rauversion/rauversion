"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import type { RauVizBlock as RauVizBlockType } from "@/lib/blocks/types"
import { rauVizDocument } from "@/lib/rauviz-embed"

export function RauVizBlock({ block, isEditing }: { block: RauVizBlockType; isEditing?: boolean }) {
  const { src, controls, sensitivity } = block.props
  const document = React.useMemo(() => {
    if (!src?.trim()) return null
    try {
      return rauVizDocument({ src, controls, sensitivity })
    } catch {
      return null
    }
  }, [src, controls, sensitivity])

  if (!document) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted p-4 text-center text-muted-foreground">
        <Sparkles className="h-8 w-8" />
        <span className="text-sm">{isEditing ? "Configura la URL del patch RauViz (HTTP o HTTPS)." : "Visualización RauViz no disponible."}</span>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        title="Visualización RauViz"
        srcDoc={document}
        sandbox="allow-scripts allow-same-origin"
        allow="autoplay; fullscreen"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
      />
      {isEditing && <div className="absolute inset-0 cursor-pointer" aria-hidden="true" />}
    </div>
  )
}
