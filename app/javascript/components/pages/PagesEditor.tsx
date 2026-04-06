import React from "react"
import { useParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { EditorWorkspace } from "@/components/page-editor/editor-workspace"
import type { Page as EditorPage } from "@/lib/blocks/types"
import {
  fetchContentPage,
  saveContentPageBody,
  normalizeContentPageBody,
  hasLegacyContentPageBody,
  type ContentPageRecord,
} from "@/lib/content-pages"

export default function PagesEditor() {
  const { id } = useParams()
  const { toast } = useToast()
  const [pageRecord, setPageRecord] = React.useState<ContentPageRecord | null>(null)
  const [loadFailed, setLoadFailed] = React.useState(false)
  const [initialPages, setInitialPages] = React.useState<EditorPage[] | null | undefined>(
    id ? undefined : null
  )

  React.useEffect(() => {
    if (!id) {
      setLoadFailed(true)
      setInitialPages(null)
      return
    }

    let cancelled = false

    const loadPage = async () => {
      try {
        const record = await fetchContentPage(id)

        if (cancelled) return

        setPageRecord(record)
        setLoadFailed(false)
        setInitialPages(normalizeContentPageBody(record.body))
      } catch (error) {
        if (!cancelled) {
          setPageRecord(null)
          setLoadFailed(true)
          setInitialPages(null)
        }

        toast({
          title: "Error",
          description: "Could not load page",
          variant: "destructive",
        })
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [id, toast])

  const legacyNotice = pageRecord && hasLegacyContentPageBody(pageRecord.body) ? (
    <div className="px-4 py-2 text-sm border-b border-amber-200 bg-amber-50 text-amber-900">
      Esta pagina usa un formato antiguo. Si guardas desde este editor, se reemplazara por el formato nuevo.
    </div>
  ) : null

  if (loadFailed) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No se pudo cargar la pagina.</p>
      </div>
    )
  }

  return (
    <EditorWorkspace
      storageNamespace={id ? `pages:${id}` : undefined}
      initialPages={initialPages}
      deferInitialLoad={Boolean(id && initialPages === undefined)}
      defaultPageName={pageRecord?.title}
      title="Pages Editor"
      templateCategory="pages"
      previewUrl={pageRecord?.slug ? `/pages/${pageRecord.slug}` : undefined}
      onPersistPages={id ? (pages) => saveContentPageBody(id, pages) : undefined}
      loadingMessage="Cargando pagina..."
      notice={legacyNotice}
    />
  )
}
