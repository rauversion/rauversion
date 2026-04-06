"use client"

import { useCallback, useRef, useEffect } from "react"
import type { Page } from "@/lib/blocks/types"

const MAX_HISTORY_SIZE = 20

interface HistoryState {
  past: Page[]
  future: Page[]
}

export function useHistory(
  page: Page | null,
  setPage: (page: Page) => void,
  isLoaded: boolean
) {
  const historyRef = useRef<HistoryState>({
    past: [],
    future: [],
  })
  
  // Track if the change is from undo/redo to avoid adding to history
  const isUndoRedoRef = useRef(false)
  // Track last saved state to detect real changes
  const lastSavedRef = useRef<string>("")

  // Save current state to history when page changes
  useEffect(() => {
    if (!page || !isLoaded) return
    
    // Skip if this change is from undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }

    const currentState = JSON.stringify(page)
    
    // Skip if no real change
    if (currentState === lastSavedRef.current) return
    
    // Only save if there's an actual previous state
    if (lastSavedRef.current) {
      const previousPage = JSON.parse(lastSavedRef.current) as Page
      
      historyRef.current.past.push(previousPage)
      
      // Limit history size
      if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
        historyRef.current.past.shift()
      }
      
      // Clear future when new change is made
      historyRef.current.future = []
    }
    
    lastSavedRef.current = currentState
  }, [page, isLoaded])

  const undo = useCallback(() => {
    if (!page || historyRef.current.past.length === 0) return false

    const previousState = historyRef.current.past.pop()!
    
    // Save current state to future
    historyRef.current.future.push(page)
    
    // Limit future size
    if (historyRef.current.future.length > MAX_HISTORY_SIZE) {
      historyRef.current.future.shift()
    }

    // Mark as undo/redo operation
    isUndoRedoRef.current = true
    lastSavedRef.current = JSON.stringify(previousState)
    setPage(previousState)
    
    return true
  }, [page, setPage])

  const redo = useCallback(() => {
    if (!page || historyRef.current.future.length === 0) return false

    const nextState = historyRef.current.future.pop()!
    
    // Save current state to past
    historyRef.current.past.push(page)
    
    // Limit past size
    if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
      historyRef.current.past.shift()
    }

    // Mark as undo/redo operation
    isUndoRedoRef.current = true
    lastSavedRef.current = JSON.stringify(nextState)
    setPage(nextState)
    
    return true
  }, [page, setPage])

  const canUndo = historyRef.current.past.length > 0
  const canRedo = historyRef.current.future.length > 0

  const clearHistory = useCallback(() => {
    historyRef.current = {
      past: [],
      future: [],
    }
    if (page) {
      lastSavedRef.current = JSON.stringify(page)
    }
  }, [page])

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: historyRef.current.past.length,
    futureLength: historyRef.current.future.length,
  }
}
