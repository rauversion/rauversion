import React from "react"

import blockRegistry from "../registry-config"
import type { BlockDefinition, BlockType, ChildContainer } from "./types"
import { v4 as uuidv4 } from "uuid"

// Get all block types for the palette
export const getAllBlockTypes = (): BlockDefinition[] => {
  return Object.values(blockRegistry).filter((block) => block.type !== "page") // Don't show page in palette
}

// Get a specific block definition
export const getBlockDefinition = (type: BlockType): BlockDefinition => {
  return blockRegistry[type]
}

// Get default properties for a block type
export const getDefaultProperties = (type: BlockType): Record<string, any> => {
  return blockRegistry[type]?.defaultProperties || {}
}

// Render a block
export const renderBlock = (props: any) => {
  const { block } = props
  const definition = getBlockDefinition(block.type)
  if (!definition) {
    return <div>Unknown block type: {block.type}</div>
  }
  return definition.render(props)
}

// Get property editor for a block
export const getPropertyEditor = (
  type: BlockType,
  properties: Record<string, any>,
  onChange: (property: string, value: any) => void,
) => {
  const definition = getBlockDefinition(type)
  if (!definition || !definition.propertyEditor) {
    return <div>No property editor available for this block type</div>
  }
  return definition.propertyEditor({ properties, onChange })
}

// Helper function to create a standard container
export const createContainer = (type: string, id?: string): ChildContainer => {
  return {
    id: id || uuidv4(),
    type,
    children: [],
  }
}

// Helper function to create grid cells
export const createGridCells = (count: number): ChildContainer[] => {
  return Array(count)
    .fill(null)
    .map(() => createContainer("cell"))
}

// Helper function to create tabs
export const createTabs = (count: number, titles?: string[]): ChildContainer[] => {
  return Array(count)
    .fill(null)
    .map((_, index) => ({
      id: uuidv4(),
      type: "tab",
      children: [],
      title: titles?.[index] || `Tab ${index + 1}`,
    }))
}
