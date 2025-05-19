"use client"

import React from "react"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import type { Block, BlockType, ChildContainer } from "./blocks/types"
import { getBlockDefinition, getDefaultProperties } from "./blocks/registry"

// Define the store state interface
interface BlockState {
  blocks: Block[]
  past: Block[][]
  future: Block[][]
  debug: boolean

  // Actions
  setBlocks: (blocks: Block[]) => void
  setBlocksWithHistory: (blocks: Block[]) => void
  undo: () => void
  redo: () => void
  setDebug: (value: boolean) => void
  addBlock: (type: BlockType, properties?: Record<string, any>) => string
  updateBlockProperties: (id: string, properties: Record<string, any>) => void
  moveBlock: (blockId: string, containerId: string, containerType: string) => void
  removeBlock: (id: string) => void
  getBlock: (id: string) => Block | undefined
  getBlockContainers: (block: Block) => ChildContainer[]
}

export const useBlocks = create<BlockState>((set, get) => ({
  blocks: [],
  past: [],
  future: [],
  debug: false,

  setBlocks: (blocks) => set({ blocks }),
  setBlocksWithHistory: (blocks) => {
    const { blocks: currentBlocks, past } = get()
    set({
      past: [...past, JSON.parse(JSON.stringify(currentBlocks))],
      blocks,
      future: [],
    })
  },
  undo: () => {
    const { past, blocks, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      blocks: previous,
      future: [JSON.parse(JSON.stringify(blocks)), ...future],
    })
  },
  redo: () => {
    const { past, blocks, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      past: [...past, JSON.parse(JSON.stringify(blocks))],
      blocks: next,
      future: future.slice(1),
    })
  },
  setDebug: (value) => set({ debug: value }),

  addBlock: (type, properties) => {
    const { debug, blocks } = get()
    const defaultProps = getDefaultProperties(type)
    const newBlockId = uuidv4()

    // Create the new block with appropriate structure based on type
    const newBlock: Block = {
      id: newBlockId,
      type,
      properties: { ...defaultProps, ...properties },
      children: [],
      containers: [],
    }

    // Initialize containers based on block type
    const blockDefinition = getBlockDefinition(type)
    if (blockDefinition && blockDefinition.getContainers) {
      newBlock.containers = blockDefinition.getContainers(newBlock)
    }

    if (debug) {
      console.log(`Adding new block of type ${type}:`, newBlock)
    }

    get().setBlocksWithHistory([...blocks, newBlock])
    return newBlockId
  },

  updateBlockProperties: (id, properties) => {
    const { debug, blocks } = get()

    if (debug) {
      console.log(`Updating properties for block ${id}:`, properties)
    }

    // Create a deep copy to avoid mutation issues
    const newBlocks = JSON.parse(JSON.stringify(blocks))

    // Helper function to recursively find and update a block
    const updateBlockRecursive = (blocks: Block[]): boolean => {
      for (let i = 0; i < blocks.length; i++) {
        // If this is the target block, update its properties
        if (blocks[i].id === id) {
          blocks[i].properties = { ...blocks[i].properties, ...properties }

          // Update containers if needed
          const blockDefinition = getBlockDefinition(blocks[i].type)
          if (blockDefinition && blockDefinition.getContainers) {
            blocks[i].containers = blockDefinition.getContainers(blocks[i])
          }

          return true
        }

        // Check in children
        if (blocks[i].children && blocks[i].children.length > 0) {
          if (updateBlockRecursive(blocks[i].children)) return true
        }

        // Check in containers
        if (blocks[i].containers && blocks[i].containers.length > 0) {
          for (const container of blocks[i].containers) {
            if (updateBlockRecursive(container.children)) return true
          }
        }
      }
      return false
    }

    updateBlockRecursive(newBlocks)
    get().setBlocksWithHistory(newBlocks)
  },

  moveBlock: (blockId, containerId, containerType) => {
    const { debug, blocks } = get()

    if (debug) {
      console.log(`Moving block ${blockId} to ${containerType} ${containerId}`)
    }

    // Create a deep copy
    const newBlocks = JSON.parse(JSON.stringify(blocks))

    // Find the block to move
    let blockToMove: Block | null = null

    // Helper function to find and remove a block
    const findAndRemoveBlock = (blocks: Block[]): boolean => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          blockToMove = blocks.splice(i, 1)[0]
          if (debug) console.log(`Found and removed block at top level: ${blocks[i].type}(${blocks[i].id})`)
          return true
        }

        // Check in children
        if (blocks[i].children && blocks[i].children.length > 0) {
          if (findAndRemoveBlock(blocks[i].children)) return true
        }

        // Check in containers
        if (blocks[i].containers && blocks[i].containers.length > 0) {
          for (const container of blocks[i].containers) {
            if (findAndRemoveBlock(container.children)) return true
          }
        }
      }
      return false
    }

    // Find and remove the block
    findAndRemoveBlock(newBlocks)

    if (!blockToMove) {
      if (debug) console.error(`Block with ID ${blockId} not found`)
      return
    }

    // Helper function to find a specific container by ID and type
    const findContainer = (blocks: Block[]): { found: boolean; path: string } => {
      for (let i = 0; i < blocks.length; i++) {
        const currentPath = `${blocks[i].type}(${blocks[i].id})`

        // Check if this is the target container for direct children
        if (blocks[i].id === containerId && containerType === "children") {
          if (!blocks[i].children) blocks[i].children = []
          blocks[i].children.push(blockToMove!)
          if (debug) console.log(`Added block to children of ${currentPath}`)
          return { found: true, path: currentPath }
        }

        // Check in children
        if (blocks[i].children && blocks[i].children.length > 0) {
          const result = findContainer(blocks[i].children)
          if (result.found) return result
        }

        // Check in containers
        if (blocks[i].containers && blocks[i].containers.length > 0) {
          for (const container of blocks[i].containers) {
            if (container.id === containerId) {
              if (!container.children) container.children = []
              container.children.push(blockToMove!)
              if (debug) console.log(`Added block to container ${container.type} of ${currentPath}`)
              return { found: true, path: `${currentPath} > ${container.type}(${container.id})` }
            }

            // Check in container children
            if (container.children && container.children.length > 0) {
              const result = findContainer(container.children)
              if (result.found) return result
            }
          }
        }
      }
      return { found: false, path: "" }
    }

    // Find the container and add the block
    const result = findContainer(newBlocks)

    if (result.found) {
      if (debug) {
        console.log(`Added block to container at path: ${result.path}`)
      }
      get().setBlocksWithHistory(newBlocks)
    } else {
      // If we couldn't find the container, add the block back to the top level
      if (debug) {
        console.error(`Could not find container ${containerId} of type ${containerType}`)
      }
      newBlocks.push(blockToMove)
      get().setBlocksWithHistory(newBlocks)
    }
  },

  removeBlock: (id) => {
    const { debug, blocks } = get()

    if (debug) {
      console.log(`Removing block ${id}`)
    }

    // Helper function to recursively remove a block
    const removeBlockRecursive = (blocks: Block[]): Block[] => {
      // Filter out the block at this level
      const filteredBlocks = blocks.filter((block) => block.id !== id)

      // If we removed something, return the filtered array
      if (filteredBlocks.length !== blocks.length) {
        return filteredBlocks
      }

      // Otherwise, check in children and containers
      return filteredBlocks.map((block) => {
        // Check in children
        if (block.children && block.children.length > 0) {
          return {
            ...block,
            children: removeBlockRecursive(block.children),
          }
        }

        // Check in containers
        if (block.containers && block.containers.length > 0) {
          return {
            ...block,
            containers: block.containers.map((container) => ({
              ...container,
              children: removeBlockRecursive(container.children),
            })),
          }
        }

        return block
      })
    }

    const newBlocks = removeBlockRecursive(blocks)
    get().setBlocksWithHistory(newBlocks)
  },

  getBlock: (id) => {
    const { blocks } = get()

    // Helper function to recursively find a block
    const findBlockRecursive = (blocks: Block[]): Block | undefined => {
      // Check at this level
      const block = blocks.find((b) => b.id === id)
      if (block) return block

      // Check in children
      for (const block of blocks) {
        // Check in children
        if (block.children && block.children.length > 0) {
          const found = findBlockRecursive(block.children)
          if (found) return found
        }

        // Check in containers
        if (block.containers && block.containers.length > 0) {
          for (const container of block.containers) {
            if (container.children && container.children.length > 0) {
              const found = findBlockRecursive(container.children)
              if (found) return found
            }
          }
        }
      }

      return undefined
    }

    return findBlockRecursive(blocks)
  },

  getBlockContainers: (block: Block) => {
    const blockDefinition = getBlockDefinition(block.type)
    if (blockDefinition && blockDefinition.getContainers) {
      return blockDefinition.getContainers(block)
    }
    return []
  },
}))

export type { BlockType } from "./blocks/types"

// BlocksProvider for context initialization (for preview/SSR)
export function BlocksProvider({ initialBlocks, children }: { initialBlocks: any[]; children: React.ReactNode }) {
  const setBlocks = useBlocks((state) => state.setBlocks)
  React.useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(initialBlocks)
    }
    // eslint-disable-next-line
  }, [JSON.stringify(initialBlocks)])
  return <>{children}</>
}
