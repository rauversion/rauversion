import React from "react"
import { useParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { EditorPageView } from "@/components/page-editor/page-view"
import {
  fetchContentPage,
  normalizeContentPageBody,
  hasLegacyContentPageBody,
} from "@/lib/content-pages"

export default function PagesShow() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [page, setPage] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setLoading(false)
        return
      }

      try {
        const data = await fetchContentPage(slug)
        setPage(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load page",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [slug, toast])

  if (loading) {
    return (
      <div className="min-h-screen">
        loading....
      </div>
    )
  }

  if (!page) return <p className="text-center text-muted-foreground">Page not found</p>

  const editorPages = normalizeContentPageBody(page.body)
  const firstEditorPage = editorPages[0]

  if (firstEditorPage) {
    return <EditorPageView page={firstEditorPage} footerText="Creado con Pages Editor" />
  }

  if (hasLegacyContentPageBody(page.body)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-xl space-y-3">
          <h1 className="text-2xl font-semibold">Contenido no disponible</h1>
          <p className="text-muted-foreground">
            Esta pagina sigue usando un formato antiguo y necesita ser guardada nuevamente con el editor actual.
          </p>
        </div>
      </div>
    )
  }

  return null
}
