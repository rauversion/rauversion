import React from "react"
import { useParams } from "react-router-dom"
import { Disc3 } from "lucide-react"

import type { Page } from "@/lib/blocks/types"
import { getCurrentPageId, loadPages } from "@/lib/storage"
import { fetchEditableEventSite } from "@/lib/event-sites"
import { EditorPageView } from "@/components/page-editor/page-view"

export default function EventSitePreview() {
  const { slug, pageId } = useParams()
  const [eventSite, setEventSite] = React.useState<Awaited<ReturnType<typeof fetchEditableEventSite>> | null>(null)
  const [page, setPage] = React.useState<Page | null>(null)
  const [notFound, setNotFound] = React.useState(false)

  React.useEffect(() => {
    if (!slug) {
      setNotFound(true)
      return
    }

    let cancelled = false

    const loadPreview = async () => {
      try {
        const record = await fetchEditableEventSite(slug)
        const storageNamespace = `events:${slug}`
        const localPages = loadPages(storageNamespace)
        const availablePages = localPages.length > 0 ? localPages : record.sitePages
        const targetPageId =
          pageId ||
          getCurrentPageId(storageNamespace) ||
          availablePages[0]?.id
        const currentPage =
          availablePages.find((candidate) => candidate.id === targetPageId) || null

        if (cancelled) return

        setEventSite(record)
        setPage(currentPage)
        setNotFound(!currentPage)
      } catch (error) {
        if (!cancelled) {
          setEventSite(null)
          setPage(null)
          setNotFound(true)
        }
      }
    }

    loadPreview()

    return () => {
      cancelled = true
    }
  }, [slug, pageId])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Disc3 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Preview no disponible</h1>
        <p className="text-muted-foreground">La página del evento no existe o todavía no tiene contenido.</p>
      </div>
    )
  }

  if (!page || !eventSite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Disc3 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <EditorPageView
      page={page}
      eventSite={eventSite}
      footerText={`Preview de ${eventSite.title}`}
      contentWidthClassName="max-w-6xl"
    />
  )
}
