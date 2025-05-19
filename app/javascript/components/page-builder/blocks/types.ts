// Add the DEBUG_RENDER global to the window interface
declare global {
  interface Window {
    DEBUG_RENDER?: boolean
  }
}

import type { ReactNode } from "react"

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "spacer"
  | "container"
  | "grid"
  | "page"
  | "tabs"
  | "card"
  | "carousel"
  | "flex"
  | "playlist"
  | "productCard"
  | "section"
  | "hero"
  | "multi-input"
  | "oembed";


// Define a standard child container interface
export interface ChildContainer {
  id: string
  type: string
  children: Block[]
}

export interface BlockProps {
  id: string
  type: BlockType
  properties: Record<string, any>
  children?: Block[]
  // New standardized containers array for all types of child containers
  containers?: ChildContainer[]
}

export type Block = BlockProps

export interface BlockRendererProps {
  block: BlockInstance
  isSelected: boolean
  onSelect: () => void
  isChild?: boolean
  parentId?: string
  containerId?: string
  containerType?: string
  isPreview?: boolean
}

export interface PropertyEditorProps {
  properties: Record<string, any>
  onChange: (property: string, value: any) => void
}

export interface BlockDefinition {
  type: BlockType
  label: string
  icon: ReactNode
  defaultProperties: Record<string, any>
  render: (props: BlockRendererProps) => JSX.Element
  propertyEditor: (props: PropertyEditorProps) => JSX.Element
  // Add a flag to indicate if this block can have children
  canHaveChildren?: boolean
  // Add a function to get the containers for this block
  getContainers?: (block: Block) => ChildContainer[]
}

// Legacy interface for backward compatibility during refactoring
export interface GridCell {
  id: string
  blocks: Block[]
  colSpan?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}
