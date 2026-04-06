"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { EditorWorkspace } from "./editor-workspace"
import { fetchReleasePages, saveReleasePages } from "@/lib/release-editor-pages"
import type { Page } from "@/lib/blocks/types"

export default function EditorPage() {
  const { id } = useParams()
  const storageNamespace = id ? `releases2:${id}` : undefined
  const [initialReleasePages, setInitialReleasePages] = useState<Page[] | null | undefined>(
    id ? undefined : null
  )

  useEffect(() => {
    if (!id) {
      setInitialReleasePages(null)
      return
    }

    let cancelled = false

    const loadReleasePages = async () => {
      try {
        const remotePages = await fetchReleasePages(id)
        if (!cancelled) {
          setInitialReleasePages(remotePages)
        }
      } catch (error) {
        console.error("Error loading release pages:", error)
        if (!cancelled) {
          setInitialReleasePages(null)
        }
      }
    }

    loadReleasePages()

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <EditorWorkspace
      storageNamespace={storageNamespace}
      initialPages={initialReleasePages}
      deferInitialLoad={Boolean(id && initialReleasePages === undefined)}
      title="Release Editor"
      templateCategory="album-releases"
      previewUrl={(page) => id ? `/releases2/${id}/preview/${page.id}` : undefined}
      onPersistPages={id ? (pages) => saveReleasePages(id, pages) : undefined}
      loadingMessage="Cargando editor..."
    />
  )
}
