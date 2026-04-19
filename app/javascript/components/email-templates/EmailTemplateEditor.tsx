import React from "react"
import { useParams } from "react-router-dom"

import { useToast } from "@/hooks/use-toast"
import { EmailEditorWorkspace } from "@/components/email-editor/workspace"
import {
  fetchEmailTemplate,
  updateEmailTemplate,
} from "@/lib/email-editor/api"
import { normalizeEmailDocument } from "@/lib/email-editor/normalizers"
import type { EmailDocument } from "@/lib/email-editor/types"

export default function EmailTemplateEditor() {
  const { id } = useParams()
  const { toast } = useToast()
  const [initialDocument, setInitialDocument] = React.useState<EmailDocument | null | undefined>(id ? undefined : null)
  const [templateName, setTemplateName] = React.useState("Email Editor")
  const [loadFailed, setLoadFailed] = React.useState(false)

  React.useEffect(() => {
    if (!id) {
      setLoadFailed(true)
      setInitialDocument(null)
      return
    }

    let cancelled = false

    const loadTemplate = async () => {
      try {
        const template = await fetchEmailTemplate(id)
        if (cancelled) return

        setTemplateName(template.name)
        setInitialDocument(normalizeEmailDocument(template.document, template.name))
        setLoadFailed(false)
      } catch (error) {
        if (cancelled) return

        setLoadFailed(true)
        setInitialDocument(null)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo cargar el correo",
          variant: "destructive",
        })
      }
    }

    loadTemplate()

    return () => {
      cancelled = true
    }
  }, [id, toast])

  if (loadFailed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No se pudo cargar la plantilla de email.</p>
      </div>
    )
  }

  return (
    <EmailEditorWorkspace
      storageNamespace={id ? `email-templates:${id}` : undefined}
      initialDocument={initialDocument}
      deferInitialLoad={Boolean(id && initialDocument === undefined)}
      title={templateName}
      loadingMessage="Cargando plantilla de email..."
      onPersistDocument={id ? async (document) => {
        const saved = await updateEmailTemplate(id, {
          name: document.name,
          subject: document.subject,
          preheader: document.preheader,
          document,
        })
        setTemplateName(saved.name)
      } : undefined}
    />
  )
}
