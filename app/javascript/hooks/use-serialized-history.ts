"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const MAX_HISTORY_SIZE = 20

interface HistoryState<T> {
  past: T[]
  future: T[]
}

export function useSerializedHistory<T>(
  value: T | null,
  setValue: (nextValue: T) => void,
  isLoaded: boolean
) {
  const historyRef = useRef<HistoryState<T>>({
    past: [],
    future: [],
  })
  const isUndoRedoRef = useRef(false)
  const lastSavedRef = useRef("")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateAvailability = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0)
    setCanRedo(historyRef.current.future.length > 0)
  }, [])

  useEffect(() => {
    if (!value || !isLoaded) return

    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }

    const serialized = JSON.stringify(value)
    if (serialized === lastSavedRef.current) return

    if (lastSavedRef.current) {
      historyRef.current.past.push(JSON.parse(lastSavedRef.current) as T)
      if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
        historyRef.current.past.shift()
      }
      historyRef.current.future = []
    }

    lastSavedRef.current = serialized
    updateAvailability()
  }, [value, isLoaded, updateAvailability])

  const undo = useCallback(() => {
    if (!value || historyRef.current.past.length === 0) return false

    const previous = historyRef.current.past.pop() as T
    historyRef.current.future.push(value)
    if (historyRef.current.future.length > MAX_HISTORY_SIZE) {
      historyRef.current.future.shift()
    }

    isUndoRedoRef.current = true
    lastSavedRef.current = JSON.stringify(previous)
    setValue(previous)
    updateAvailability()
    return true
  }, [setValue, value, updateAvailability])

  const redo = useCallback(() => {
    if (!value || historyRef.current.future.length === 0) return false

    const nextValue = historyRef.current.future.pop() as T
    historyRef.current.past.push(value)
    if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
      historyRef.current.past.shift()
    }

    isUndoRedoRef.current = true
    lastSavedRef.current = JSON.stringify(nextValue)
    setValue(nextValue)
    updateAvailability()
    return true
  }, [setValue, value, updateAvailability])

  const clearHistory = useCallback(() => {
    historyRef.current = {
      past: [],
      future: [],
    }

    if (value) {
      lastSavedRef.current = JSON.stringify(value)
    }
    updateAvailability()
  }, [value, updateAvailability])

  return {
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  }
}
