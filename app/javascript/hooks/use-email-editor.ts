"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { arrayMove } from "@dnd-kit/sortable"

import { createDefaultEmailBlock, createNewEmailDocument } from "@/lib/email-editor/defaults"
import { normalizeEmailDocument } from "@/lib/email-editor/normalizers"
import { loadEmailDocument, saveEmailDocument } from "@/lib/email-editor/storage"
import type { EmailBlock, EmailBlockType, EmailDocument, EmailTheme } from "@/lib/email-editor/types"

interface UseEmailEditorOptions {
  storageNamespace?: string
  initialDocument?: EmailDocument | null
  deferInitialLoad?: boolean
  defaultName?: string
}

export function useEmailEditor({
  storageNamespace,
  initialDocument,
  deferInitialLoad = false,
  defaultName,
}: UseEmailEditorOptions = {}) {
  const [document, setDocument] = useState<EmailDocument | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (deferInitialLoad) return

    const draft = loadEmailDocument(storageNamespace)
    if (draft) {
      setDocument(normalizeEmailDocument(draft, defaultName))
    } else if (initialDocument) {
      const normalized = normalizeEmailDocument(initialDocument, initialDocument.name || defaultName)
      setDocument(normalized)
      saveEmailDocument(normalized, storageNamespace)
    } else {
      const nextDocument = createNewEmailDocument(defaultName)
      setDocument(nextDocument)
      saveEmailDocument(nextDocument, storageNamespace)
    }

    setIsLoaded(true)
  }, [defaultName, deferInitialLoad, initialDocument, storageNamespace])

  useEffect(() => {
    if (!document || !isLoaded) return
    saveEmailDocument(document, storageNamespace)
  }, [document, isLoaded, storageNamespace])

  const addBlock = useCallback((type: EmailBlockType, index?: number) => {
    const newBlock = createDefaultEmailBlock(type)
    setDocument((prev) => {
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
  }, [])

  const updateBlockProps = useCallback((id: string, props: Record<string, unknown>) => {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === id ? { ...block, props: { ...block.props, ...props } } : block
        ),
        updatedAt: Date.now(),
      }
    })
  }, [])

  const removeBlock = useCallback((id: string) => {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.filter((block) => block.id !== id),
        updatedAt: Date.now(),
      }
    })
    setSelectedBlockId((prev) => (prev === id ? null : prev))
  }, [])

  const moveBlock = useCallback((oldIndex: number, newIndex: number) => {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: arrayMove(prev.blocks, oldIndex, newIndex),
        updatedAt: Date.now(),
      }
    })
  }, [])

  const duplicateBlock = useCallback((id: string) => {
    setDocument((prev) => {
      if (!prev) return prev
      const index = prev.blocks.findIndex((block) => block.id === id)
      if (index === -1) return prev

      const duplicated = JSON.parse(JSON.stringify(prev.blocks[index])) as EmailBlock
      duplicated.id = `${duplicated.type}-${Date.now()}`

      const blocks = [...prev.blocks]
      blocks.splice(index + 1, 0, duplicated)
      return {
        ...prev,
        blocks,
        updatedAt: Date.now(),
      }
    })
  }, [])

  const updateTheme = useCallback((updates: Partial<EmailTheme>) => {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        theme: { ...prev.theme, ...updates },
        updatedAt: Date.now(),
      }
    })
  }, [])

  const updateDocumentMeta = useCallback((updates: Partial<Pick<EmailDocument, "name" | "subject" | "preheader">>) => {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        ...updates,
        updatedAt: Date.now(),
      }
    })
  }, [])

  const setDocumentDirect = useCallback((nextDocument: EmailDocument) => {
    setDocument(normalizeEmailDocument(nextDocument, nextDocument.name))
  }, [])

  const selectedBlock = useMemo(
    () => document?.blocks.find((block) => block.id === selectedBlockId) || null,
    [document?.blocks, selectedBlockId]
  )

  return {
    document,
    selectedBlock,
    selectedBlockId,
    activeTab,
    isLoaded,
    setSelectedBlockId,
    setActiveTab,
    addBlock,
    updateBlockProps,
    removeBlock,
    moveBlock,
    duplicateBlock,
    updateTheme,
    updateDocumentMeta,
    setDocumentDirect,
  }
}
