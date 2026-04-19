"use client"

import React from "react"
import { Check, Code2, Copy, Eye, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { compileEmailPreview } from "@/lib/email-editor/api"
import { normalizeEmailDocument } from "@/lib/email-editor/normalizers"
import { serializeEmailDocumentToMjml } from "@/lib/email-editor/serializer"
import type { EmailDocument } from "@/lib/email-editor/types"

function formatPreviewErrors(errors: Array<Record<string, unknown> | string>) {
  return errors.map((error) => {
    if (typeof error === "string") return error
    if (typeof error.message === "string") return error.message
    return JSON.stringify(error)
  })
}

function buildPreviewMjml(document: EmailDocument) {
  return serializeEmailDocumentToMjml(normalizeEmailDocument(document, document.name))
}

export function EmailPreviewTab({
  document,
  isActive,
}: {
  document: EmailDocument
  isActive: boolean
}) {
  const [mjml, setMjml] = React.useState(() => buildPreviewMjml(document))
  const [html, setHtml] = React.useState("")
  const [errors, setErrors] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [copied, setCopied] = React.useState<"mjml" | "html" | null>(null)
  const [deviceMode, setDeviceMode] = React.useState<"desktop" | "mobile">("desktop")
  const latestRequestRef = React.useRef(0)

  React.useEffect(() => {
    const nextMjml = buildPreviewMjml(document)
    setMjml(nextMjml)

    if (!isActive) return

    const requestId = latestRequestRef.current + 1
    latestRequestRef.current = requestId

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const result = await compileEmailPreview(nextMjml)
        if (latestRequestRef.current !== requestId) return
        setHtml(result.html)
        setErrors(formatPreviewErrors(result.errors))
      } catch (error) {
        if (latestRequestRef.current !== requestId) return
        setHtml("")
        setErrors([error instanceof Error ? error.message : "No se pudo compilar el preview"])
      } finally {
        if (latestRequestRef.current !== requestId) return
        setIsLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [document, isActive])

  const copy = async (value: string, target: "mjml" | "html") => {
    await navigator.clipboard.writeText(value)
    setCopied(target)
    window.setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant={deviceMode === "desktop" ? "default" : "ghost"} size="sm" onClick={() => setDeviceMode("desktop")}>
            <Eye className="mr-1 h-4 w-4" />
            Desktop
          </Button>
          <Button type="button" variant={deviceMode === "mobile" ? "default" : "ghost"} size="sm" onClick={() => setDeviceMode("mobile")}>
            <Smartphone className="mr-1 h-4 w-4" />
            Mobile
          </Button>
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Compilando MJML…</p> : null}
      </div>

      <Tabs defaultValue="rendered" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="rendered">Render</TabsTrigger>
            <TabsTrigger value="mjml">MJML</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rendered" className="m-0 flex-1 overflow-auto bg-[#ebe7de] p-6">
          {errors.length > 0 ? (
            <div className="mx-auto mb-4 max-w-4xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">MJML warnings</p>
              <ul className="mt-2 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={`mx-auto overflow-hidden rounded-[28px] border bg-white shadow-xl ${deviceMode === "mobile" ? "max-w-[390px]" : "max-w-[920px]"}`}>
            {html ? (
              <iframe title="email-preview" srcDoc={html} className="h-[900px] w-full bg-white" />
            ) : (
              <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
                El preview aparecerá aquí cuando el MJML compile correctamente.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mjml" className="m-0 flex-1 overflow-auto bg-slate-950 p-4">
          <div className="mb-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => copy(mjml, "mjml")}>
              {copied === "mjml" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              Copiar MJML
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-100">
            <code>{mjml}</code>
          </pre>
        </TabsContent>

        <TabsContent value="html" className="m-0 flex-1 overflow-auto bg-slate-950 p-4">
          <div className="mb-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => copy(html, "html")} disabled={!html}>
              {copied === "html" ? <Check className="mr-1 h-4 w-4" /> : <Code2 className="mr-1 h-4 w-4" />}
              Copiar HTML
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-100">
            <code>{html || "Todavía no hay HTML compilado."}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}
