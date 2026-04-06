"use client"

import { useState, useCallback, useEffect } from "react"
import type { Block, Page, PageStyle, BlockType, CarouselSlide } from "@/lib/blocks/types"
import { createDefaultBlock, createNewPage } from "@/lib/blocks/defaults"
import {
  savePage,
  savePages,
  loadPage,
  loadPages,
  getCurrentPageId,
  setCurrentPageId,
} from "@/lib/storage"
import { arrayMove } from "@dnd-kit/sortable"

interface UseEditorOptions {
  storageNamespace?: string
  initialPages?: Page[] | null
  deferInitialLoad?: boolean
  defaultPageName?: string
}

export function useEditor({
  storageNamespace,
  initialPages,
  deferInitialLoad = false,
  defaultPageName,
}: UseEditorOptions = {}) {
  const [page, setPage] = useState<Page | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor")
  const [pages, setPages] = useState<Page[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved pages on mount
  useEffect(() => {
    if (deferInitialLoad) return

    const savedPages = loadPages(storageNamespace)
    setPages(savedPages)

    const currentId = getCurrentPageId(storageNamespace)
    if (currentId) {
      const currentPage = loadPage(currentId, storageNamespace)
      if (currentPage) {
        setPage(currentPage)
      } else {
        if (savedPages.length > 0) {
          setPage(savedPages[0])
          setCurrentPageId(savedPages[0].id, storageNamespace)
        } else if (initialPages && initialPages.length > 0) {
          savePages(initialPages, storageNamespace)
          setPages(initialPages)
          setPage(initialPages[0])
          setCurrentPageId(initialPages[0].id, storageNamespace)
        } else {
          const newPage = createNewPage(defaultPageName)
          setPage(newPage)
          savePage(newPage, storageNamespace)
          setCurrentPageId(newPage.id, storageNamespace)
        }
      }
    } else if (savedPages.length > 0) {
      setPage(savedPages[0])
      setCurrentPageId(savedPages[0].id, storageNamespace)
    } else if (initialPages && initialPages.length > 0) {
      savePages(initialPages, storageNamespace)
      setPages(initialPages)
      setPage(initialPages[0])
      setCurrentPageId(initialPages[0].id, storageNamespace)
    } else {
      const newPage = createNewPage(defaultPageName)
      setPage(newPage)
      savePage(newPage, storageNamespace)
      setCurrentPageId(newPage.id, storageNamespace)
    }
    setIsLoaded(true)
  }, [storageNamespace, initialPages, deferInitialLoad, defaultPageName])

  // Auto-save when page changes
  useEffect(() => {
    if (page && isLoaded) {
      savePage(page, storageNamespace)
      setPages((prev) => {
        const idx = prev.findIndex((p) => p.id === page.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = page
          return updated
        }
        return [...prev, page]
      })
    }
  }, [page, isLoaded, storageNamespace])

  const addBlock = useCallback((type: BlockType, index?: number) => {
    const newBlock = createDefaultBlock(type)
    setPage((prev) => {
      if (!prev) return prev
      const blocks = [...prev.blocks]
      if (typeof index === "number") {
        blocks.splice(index, 0, newBlock)
      } else {
        blocks.push(newBlock)
      }
      return { ...prev, blocks, updatedAt: Date.now() }
    })
    setSelectedBlockId(newBlock.id)
    return newBlock
  }, [])

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setPage((prev) => {
      if (!prev) return prev
      const blocks = prev.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
      return { ...prev, blocks, updatedAt: Date.now() }
    })
  }, [])

  // Helper to update block props recursively (columns and carousels)
  const updateBlockPropsRecursive = (blocks: Block[], id: string, props: Record<string, unknown>): Block[] => {
    return blocks.map((block) => {
      if (block.id === id) {
        return { ...block, props: { ...block.props, ...props } }
      }
      if (block.type === "column" && block.children) {
        return {
          ...block,
          children: updateBlockPropsRecursive(block.children, id, props),
        }
      }
      if (block.type === "carousel" && block.slides) {
        return {
          ...block,
          slides: block.slides.map((slide) => ({
            ...slide,
            blocks: updateBlockPropsRecursive(slide.blocks, id, props),
          })),
        }
      }
      return block
    })
  }

  const updateBlockProps = useCallback(
    (id: string, props: Record<string, unknown>) => {
      setPage((prev) => {
        if (!prev) return prev
        const blocks = updateBlockPropsRecursive(prev.blocks, id, props)
        return { ...prev, blocks, updatedAt: Date.now() }
      })
    },
    []
  )

  const removeBlock = useCallback((id: string) => {
    setPage((prev) => {
      if (!prev) return prev
      const blocks = prev.blocks.filter((block) => block.id !== id)
      return { ...prev, blocks, updatedAt: Date.now() }
    })
    setSelectedBlockId((prev) => (prev === id ? null : prev))
  }, [])

  const moveBlock = useCallback((oldIndex: number, newIndex: number) => {
    setPage((prev) => {
      if (!prev) return prev
      const blocks = arrayMove(prev.blocks, oldIndex, newIndex)
      return { ...prev, blocks, updatedAt: Date.now() }
    })
  }, [])

  const duplicateBlock = useCallback((id: string) => {
    setPage((prev) => {
      if (!prev) return prev
      const blockIndex = prev.blocks.findIndex((b) => b.id === id)
      if (blockIndex === -1) return prev

      const block = prev.blocks[blockIndex]
      const newBlock = {
        ...JSON.parse(JSON.stringify(block)),
        id: `${block.type}-${Date.now()}`,
      }

      const blocks = [...prev.blocks]
      blocks.splice(blockIndex + 1, 0, newBlock)
      return { ...prev, blocks, updatedAt: Date.now() }
    })
  }, [])

  // Column block specific functions
  const updateColumnChildren = useCallback(
    (blockId: string, children: Block[]) => {
      setPage((prev) => {
        if (!prev) return prev
        const blocks = prev.blocks.map((block) => {
          if (block.id === blockId && block.type === "column") {
            return { ...block, children }
          }
          return block
        })
        return { ...prev, blocks, updatedAt: Date.now() }
      })
    },
    []
  )

  const addChildBlock = useCallback(
    (parentBlockId: string, columnIndex: number, blockType: BlockType) => {
      const newBlock = createDefaultBlock(blockType)
      setPage((prev) => {
        if (!prev) return prev
        const blocks = prev.blocks.map((block) => {
          if (block.id === parentBlockId && block.type === "column") {
            const children = [...(block.children || [])]
            // Insert at the end of the column
            const columns = block.props.columns
            let insertIndex = 0
            for (let i = 0; i <= columnIndex; i++) {
              const itemsInColumn = children.filter(
                (_, idx) => idx % columns === i
              ).length
              if (i < columnIndex) {
                insertIndex += itemsInColumn
              } else {
                insertIndex =
                  children.length > 0
                    ? Math.min(
                        columnIndex +
                          Math.floor(children.length / columns) * columns,
                        children.length
                      )
                    : columnIndex
              }
            }
            // Simpler approach: just add at the end
            children.push(newBlock)
            return { ...block, children }
          }
          return block
        })
        return { ...prev, blocks, updatedAt: Date.now() }
      })
      setSelectedBlockId(newBlock.id)
    },
    []
  )

  const removeChildBlock = useCallback((parentBlockId: string, childId: string) => {
    setPage((prev) => {
      if (!prev) return prev
      const blocks = prev.blocks.map((block) => {
        if (block.id === parentBlockId && block.type === "column") {
          const children = (block.children || []).filter((c) => c.id !== childId)
          return { ...block, children }
        }
        return block
      })
      return { ...prev, blocks, updatedAt: Date.now() }
    })
    setSelectedBlockId((prev) => (prev === childId ? null : prev))
  }, [])

  // Carousel block specific functions
  const updateCarouselSlides = useCallback(
    (blockId: string, slides: CarouselSlide[]) => {
      setPage((prev) => {
        if (!prev) return prev
        const blocks = prev.blocks.map((block) => {
          if (block.id === blockId && block.type === "carousel") {
            return { ...block, slides }
          }
          return block
        })
        return { ...prev, blocks, updatedAt: Date.now() }
      })
    },
    []
  )

  const updateStyle = useCallback((updates: Partial<PageStyle>) => {
    setPage((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        style: { ...prev.style, ...updates },
        updatedAt: Date.now(),
      }
    })
  }, [])

  const updatePageName = useCallback((name: string) => {
    setPage((prev) => {
      if (!prev) return prev
      return { ...prev, name, updatedAt: Date.now() }
    })
  }, [])

  const createPage = useCallback((name?: string) => {
    const newPage = createNewPage(name)
    setPage(newPage)
    setCurrentPageId(newPage.id, storageNamespace)
    setSelectedBlockId(null)
    return newPage
  }, [storageNamespace])

  const switchPage = useCallback((id: string) => {
    const targetPage = loadPage(id, storageNamespace)
    if (targetPage) {
      setPage(targetPage)
      setCurrentPageId(id, storageNamespace)
      setSelectedBlockId(null)
    }
  }, [storageNamespace])

  // Direct page setter for undo/redo and template application
  const setPageDirect = useCallback((newPage: Page) => {
    setPage(newPage)
    setCurrentPageId(newPage.id, storageNamespace)
  }, [storageNamespace])

  const replacePages = useCallback((nextPages: Page[]) => {
    const normalizedPages = nextPages.length > 0 ? nextPages : [createNewPage(defaultPageName)]
    const currentId = getCurrentPageId(storageNamespace)
    const nextCurrentPage =
      normalizedPages.find((candidate) => candidate.id === currentId) || normalizedPages[0]

    savePages(normalizedPages, storageNamespace)
    setPages(normalizedPages)
    setPage(nextCurrentPage)
    setCurrentPageId(nextCurrentPage.id, storageNamespace)
    setSelectedBlockId(null)
  }, [storageNamespace, defaultPageName])

  // Find block recursively (including children of columns and carousel slides)
  const findBlockRecursively = useCallback((blocks: Block[], id: string): Block | null => {
    for (const block of blocks) {
      if (block.id === id) return block
      if (block.type === "column" && block.children) {
        const found = findBlockRecursively(block.children, id)
        if (found) return found
      }
      if (block.type === "carousel" && block.slides) {
        for (const slide of block.slides) {
          const found = findBlockRecursively(slide.blocks, id)
          if (found) return found
        }
      }
    }
    return null
  }, [])

  const selectedBlock = page ? findBlockRecursively(page.blocks, selectedBlockId || "") : null

  return {
    page,
    pages,
    selectedBlock,
    selectedBlockId,
    setSelectedBlockId,
    activeTab,
    setActiveTab,
    isLoaded,
    addBlock,
    updateBlock,
    updateBlockProps,
    removeBlock,
    moveBlock,
    duplicateBlock,
    updateStyle,
    updatePageName,
    createPage,
    switchPage,
    setPageDirect,
    replacePages,
    // Column block functions
    updateColumnChildren,
    addChildBlock,
    removeChildBlock,
    // Carousel block functions
    updateCarouselSlides,
  }
}
