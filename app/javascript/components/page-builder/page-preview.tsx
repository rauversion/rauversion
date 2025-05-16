"use client"
import React, { createContext, useContext } from "react"

import { useBlocks } from "./block-context"
import { renderBlock } from "./blocks/registry"

export const PreviewOptionsContext = createContext<{ isPreview?: boolean; [key: string]: any }>({ isPreview: false })
export function usePreviewOptions() {
  return useContext(PreviewOptionsContext)
}

export function PagePreview({ blocks: propBlocks, options }: { blocks?: any[]; options?: Record<string, any> }) {
  const context = useBlocks()
  const blocks = propBlocks || context.blocks
  // Provide options context (default isPreview: true for preview)
  return (
    <PreviewOptionsContext.Provider value={{ isPreview: true, ...(options || {}) }}>
      <PagePreviewInner blocks={blocks} />
    </PreviewOptionsContext.Provider>
  )
}

function PagePreviewInner({ blocks }: { blocks?: any[] }) {
  // Find the page block
  const pageBlock = blocks.find((block) => block.type === "page")

  if (!pageBlock) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>No page block found. Please create a page block to start building.</p>
        </div>
      </div>
    )
  }

  // Create a simplified version of the block renderer props
  const previewProps = {
    block: pageBlock,
    isSelected: false,
    onSelect: () => {}, // No-op in preview mode
    isPreview: true,
  }

  return <div className="w-full">{renderBlock(previewProps)}</div>
}
