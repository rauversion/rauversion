"use client"

import React from "react"
import { useEffect, useRef } from "react"
import { useBlocks } from "./block-context"
import { BlockRenderer } from "./block-renderer"
import { cn } from "@/lib/utils"

interface EditorCanvasProps {
  selectedBlockId: string | null
  setSelectedBlockId: (id: string | null) => void
  displayMode?: "desktop" | "tablet" | "mobile"
}

export function EditorCanvas({ selectedBlockId, setSelectedBlockId, displayMode = "desktop" }: EditorCanvasProps) {
  const { blocks, debug } = useBlocks()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Find the page block
  const pageBlock = blocks.find((block) => block.type === "page")

  // Handle click on the canvas background (deselect all blocks)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on a block
    if (e.target === canvasRef.current) {
      setSelectedBlockId(null)
    }
  }

  // Scroll to selected block
  useEffect(() => {
    if (selectedBlockId && canvasRef.current) {
      const selectedElement = document.querySelector(`[data-block-id="${selectedBlockId}"]`)
      if (selectedElement) {
        // Scroll the element into view with some padding
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [selectedBlockId])

  if (!pageBlock) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>No page block found. Please create a page block to start building.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className={cn("min-h-full w-full bg-gray-100 p-8", debug && "bg-grid-pattern")}
      onClick={handleCanvasClick}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth:
            displayMode === "mobile"
              ? 375
              : displayMode === "tablet"
              ? 768
              : 1200,
          transition: "max-width 0.2s",
        }}
      >
        <BlockRenderer
          block={pageBlock}
          isSelected={selectedBlockId === pageBlock.id}
          onSelect={() => setSelectedBlockId(pageBlock.id)}
        />
      </div>
    </div>
  )
}
