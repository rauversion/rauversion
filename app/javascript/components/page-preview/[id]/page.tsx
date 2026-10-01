"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { Page } from "@/lib/blocks/types"
import { getCurrentPageId, loadPages } from "@/lib/storage"
import { fetchReleasePageData } from "@/lib/release-editor-pages"
import { usePageMetadata, type PageMetadata } from "@/hooks/usePageMetadata"
import { EditorPageView } from "@/components/page-editor/page-view"
import { Disc3 } from "lucide-react"

export default function PreviewPage() {
  const { id, pageId } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [metadata, setMetadata] = useState<PageMetadata | null>(null)

  usePageMetadata(metadata)

  useEffect(() => {
    setMetadata(null)
    if (!id) {
      setPage(null)
      setNotFound(true)
      return
    }

    let cancelled = false
    const releaseRequest = fetchReleasePageData(id)
    // Local drafts remain immediately available even when the metadata request
    // fails. The same request supplies saved pages when there is no local draft.
    releaseRequest.then(({ seo }) => {
      if (!cancelled) setMetadata(seo)
    }).catch(() => {})

    const loadPreviewPage = async () => {
      const storageNamespace = `releases:${id}`
      const localPages = loadPages(storageNamespace)
      const availablePages =
        localPages.length > 0
          ? localPages
          : (await releaseRequest).pages
      const targetPageId =
        pageId ||
        getCurrentPageId(storageNamespace) ||
        availablePages[0]?.id
      const found = availablePages.find((candidatePage) => candidatePage.id === targetPageId) || null

      if (cancelled) return

      setPage(found)
      setNotFound(!found)
    }

    loadPreviewPage().catch((error) => {
      console.error("Error loading release preview:", error)
      if (!cancelled) {
        setPage(null)
        setNotFound(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [id, pageId])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Disc3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pagina no encontrada</h1>
        <p className="text-muted-foreground">
          La pagina que buscas no existe o ha sido eliminada.
        </p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Disc3 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return <EditorPageView page={page} footerText="Creado con Release Editor" />
}
