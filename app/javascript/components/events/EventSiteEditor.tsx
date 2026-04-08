import React from "react"
import { Link, useParams } from "react-router-dom"

import { EditorWorkspace } from "@/components/page-editor/editor-workspace"
import { useToast } from "@/hooks/use-toast"
import type { Page } from "@/lib/blocks/types"
import {
  fetchEditableEventSite,
  saveEventSitePages,
  type EventSiteRecord,
} from "@/lib/event-sites"

export default function EventSiteEditor() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [eventSite, setEventSite] = React.useState<EventSiteRecord | null>(null)
  const [initialPages, setInitialPages] = React.useState<Page[] | null | undefined>(
    slug ? undefined : null
  )
  const [loadFailed, setLoadFailed] = React.useState(false)

  React.useEffect(() => {
    if (!slug) {
      setLoadFailed(true)
      setInitialPages(null)
      return
    }

    let cancelled = false

    const loadEventSite = async () => {
      try {
        const record = await fetchEditableEventSite(slug)

        if (cancelled) return

        setEventSite(record)
        setInitialPages(record.sitePages)
        setLoadFailed(false)
      } catch (error) {
        if (cancelled) return

        setEventSite(null)
        setInitialPages(null)
        setLoadFailed(true)
        toast({
          title: "Error",
          description: "No se pudo cargar el editor del evento",
          variant: "destructive",
        })
      }
    }

    loadEventSite()

    return () => {
      cancelled = true
    }
  }, [slug, toast])

  const notice = eventSite?.siteMode !== "custom" ? (
    <div className="px-4 py-2 text-sm border-b border-amber-200 bg-amber-50 text-amber-900">
      Este evento todavía está en modo sitio default. Cambia el modo a custom desde{" "}
      <Link className="underline" to={`/events/${slug}/edit/site`}>
        Sitio
      </Link>
      {" "}para publicar estas páginas.
    </div>
  ) : null

  if (loadFailed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No se pudo cargar el editor del evento.</p>
      </div>
    )
  }

  return (
    <EditorWorkspace
      storageNamespace={slug ? `events:${slug}` : undefined}
      initialPages={initialPages}
      deferInitialLoad={Boolean(slug && initialPages === undefined)}
      defaultPageName={eventSite?.title ? `${eventSite.title} Home` : undefined}
      title="Event Site Editor"
      templateCategory="event-sites"
      previewUrl={(page) => slug ? `/events/${slug}/preview/${page.id}` : undefined}
      onPersistPages={slug ? (pages) => saveEventSitePages(slug, pages) : undefined}
      loadingMessage="Cargando sitio del evento..."
      notice={notice}
      eventSite={eventSite}
    />
  )
}
