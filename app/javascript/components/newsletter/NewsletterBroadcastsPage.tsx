import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Edit3, Eye, Plus, Save, Send, Trash2 } from "lucide-react"

import { EmailPreviewTab } from "@/components/email-editor/preview-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  compileEmailPreview,
  createEmailTemplate,
  fetchEmailTemplates,
  type EmailTemplateRecord,
} from "@/lib/email-editor/api"
import { createNewEmailDocument } from "@/lib/email-editor/defaults"
import { normalizeEmailDocument } from "@/lib/email-editor/normalizers"
import { serializeEmailDocumentToMjml } from "@/lib/email-editor/serializer"
import {
  createNewsletterBroadcast,
  destroyNewsletterBroadcast,
  fetchNewsletterAudiences,
  fetchNewsletterBroadcast,
  fetchNewsletterBroadcasts,
  previewNewsletterAudience,
  sendNewsletterBroadcast,
  updateNewsletterBroadcast,
} from "@/lib/newsletter/api"
import type {
  NewsletterAudiencePreview,
  NewsletterAudienceRecord,
  NewsletterBroadcastRecord,
  NewsletterBroadcastStatus,
} from "@/lib/newsletter/types"
import { cn } from "@/lib/utils"

function badgeVariantForStatus(status: NewsletterBroadcastStatus) {
  switch (status) {
    case "completed":
      return "success"
    case "failed":
      return "destructive"
    case "completed_with_errors":
      return "secondary"
    default:
      return "outline"
  }
}

function labelForStatus(status: NewsletterBroadcastStatus) {
  return {
    draft: "Draft",
    queued: "En cola",
    sending: "Enviando",
    completed: "Completado",
    completed_with_errors: "Completado con errores",
    failed: "Falló",
  }[status]
}

export function NewsletterBroadcastsManager({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [broadcasts, setBroadcasts] = React.useState<NewsletterBroadcastRecord[]>([])
  const [audiences, setAudiences] = React.useState<NewsletterAudienceRecord[]>([])
  const [templates, setTemplates] = React.useState<EmailTemplateRecord[]>([])
  const [selectedBroadcastId, setSelectedBroadcastId] = React.useState<string | null>(null)
  const [broadcast, setBroadcast] = React.useState<NewsletterBroadcastRecord | null>(null)
  const [audiencePreview, setAudiencePreview] = React.useState<NewsletterAudiencePreview | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadingDetail, setLoadingDetail] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [creatingTemplate, setCreatingTemplate] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("audience")
  const previewRequestRef = React.useRef(0)

  const loadBroadcasts = React.useCallback(async () => {
    const records = await fetchNewsletterBroadcasts()
    setBroadcasts(records)
    setSelectedBroadcastId((current) => {
      if (current && records.some((item) => item.id === current)) return current
      return records[0]?.id ?? null
    })
    return records
  }, [])

  const loadAuxiliaryData = React.useCallback(async () => {
    const [nextAudiences, nextTemplates] = await Promise.all([
      fetchNewsletterAudiences(),
      fetchEmailTemplates(),
    ])

    setAudiences(nextAudiences)
    setTemplates(nextTemplates)
  }, [])

  const loadBroadcastDetail = React.useCallback(async (broadcastId: string) => {
    setLoadingDetail(true)
    try {
      setBroadcast(await fetchNewsletterBroadcast(broadcastId))
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        await Promise.all([loadBroadcasts(), loadAuxiliaryData()])
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo cargar la vista de broadcasts",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [loadAuxiliaryData, loadBroadcasts, toast])

  React.useEffect(() => {
    if (!selectedBroadcastId) {
      setBroadcast(null)
      return
    }

    loadBroadcastDetail(selectedBroadcastId).catch((error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar el broadcast",
        variant: "destructive",
      })
    })
  }, [loadBroadcastDetail, selectedBroadcastId, toast])

  React.useEffect(() => {
    if (!broadcast || !["queued", "sending"].includes(broadcast.status)) return

    const intervalId = window.setInterval(() => {
      loadBroadcastDetail(broadcast.id).catch(() => {
        window.clearInterval(intervalId)
      })
      loadBroadcasts().catch(() => {
        window.clearInterval(intervalId)
      })
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [broadcast, loadBroadcastDetail, loadBroadcasts])

  const selectedAudience = React.useMemo(
    () => audiences.find((item) => item.id === broadcast?.audienceId) ?? null,
    [audiences, broadcast?.audienceId]
  )

  const selectedTemplate = React.useMemo(
    () => templates.find((item) => item.id === broadcast?.emailTemplateId) ?? null,
    [templates, broadcast?.emailTemplateId]
  )

  React.useEffect(() => {
    if (!selectedAudience) {
      setAudiencePreview(null)
      return
    }

    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId

    previewNewsletterAudience(selectedAudience.sources)
      .then((preview) => {
        if (previewRequestRef.current !== requestId) return
        setAudiencePreview(preview)
      })
      .catch((error) => {
        if (previewRequestRef.current !== requestId) return
        setAudiencePreview(null)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo calcular la audiencia",
          variant: "destructive",
        })
      })
  }, [selectedAudience, toast])

  const broadcastLocked = Boolean(broadcast && ["queued", "sending"].includes(broadcast.status))

  const updateLocalBroadcast = (updates: Partial<NewsletterBroadcastRecord>) => {
    setBroadcast((current) => (current ? { ...current, ...updates } : current))
  }

  const persistBroadcast = async () => {
    if (!broadcast) return null

    const saved = await updateNewsletterBroadcast(broadcast.id, {
      name: broadcast.name.trim() || "Nuevo broadcast",
      audienceId: broadcast.audienceId || undefined,
      emailTemplateId: broadcast.emailTemplateId || undefined,
    })

    setBroadcast(saved)
    await loadBroadcasts()
    return saved
  }

  const handleCreateBroadcast = async () => {
    setCreating(true)
    try {
      const created = await createNewsletterBroadcast("Nuevo broadcast")
      await loadBroadcasts()
      setSelectedBroadcastId(created.id)
      setActiveTab("audience")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el broadcast",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    if (!broadcast) return

    setSaving(true)
    try {
      await persistBroadcast()
      toast({
        title: "Broadcast guardado",
        description: "Los cambios quedaron persistidos.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el broadcast",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!broadcast) return
    if (!window.confirm(`Eliminar "${broadcast.name}"?`)) return

    try {
      await destroyNewsletterBroadcast(broadcast.id)
      setBroadcast(null)
      await loadBroadcasts()
      toast({
        title: "Broadcast eliminado",
        description: `${broadcast.name} se eliminó correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el broadcast",
        variant: "destructive",
      })
    }
  }

  const handleCreateTemplate = async () => {
    setCreatingTemplate(true)
    try {
      const document = createNewEmailDocument("Nuevo correo")
      const template = await createEmailTemplate({
        name: document.name,
        subject: document.subject,
        preheader: document.preheader,
        document,
      })
      navigate(`/email-templates/${template.id}/edit`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el template",
        variant: "destructive",
      })
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleSend = async () => {
    if (!broadcast || !selectedTemplate || !broadcast.audienceId) return

    setSending(true)
    try {
      await persistBroadcast()

      const mjml = serializeEmailDocumentToMjml(
        normalizeEmailDocument(selectedTemplate.document, selectedTemplate.name)
      )
      const preview = await compileEmailPreview(mjml)
      const sent = await sendNewsletterBroadcast(broadcast.id, {
        name: broadcast.name.trim() || selectedTemplate.name,
        audienceId: broadcast.audienceId,
        emailTemplateId: selectedTemplate.id,
        subjectTemplate: selectedTemplate.document.subject || selectedTemplate.subject,
        htmlTemplate: preview.html,
      })

      setBroadcast(sent)
      await loadBroadcasts()

      toast({
        title: "Broadcast encolado",
        description: preview.errors.length > 0
          ? `Se inició el envío con ${preview.errors.length} warning(s) de MJML.`
          : "El envío quedó en cola y empezará en background.",
      })
      setActiveTab("send")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar el envío",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const content = (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Broadcasts</CardTitle>
            <CardDescription>Historial y drafts de campañas de correo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="py-8 text-sm text-muted-foreground">Cargando broadcasts…</div>
            ) : broadcasts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Crea tu primer broadcast para lanzar una campaña.
              </div>
            ) : (
              broadcasts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                    selectedBroadcastId === item.id ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                  )}
                  onClick={() => setSelectedBroadcastId(item.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.audienceName || "Sin audiencia"} · {item.emailTemplateName || "Sin template"}
                      </div>
                    </div>
                    <Badge variant={badgeVariantForStatus(item.status)}>{labelForStatus(item.status)}</Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{broadcast ? broadcast.name : "Selecciona un broadcast"}</CardTitle>
            <CardDescription>
              {broadcast
                ? "Esta vista persiste el draft del envío y después muestra el estado real de la campaña."
                : "Elige un broadcast o crea uno nuevo para empezar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!broadcast ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No hay un broadcast seleccionado.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <Input
                    value={broadcast.name}
                    onChange={(event) => updateLocalBroadcast({ name: event.target.value })}
                    disabled={broadcastLocked}
                    placeholder="Nombre del broadcast"
                  />
                  <div className="flex gap-2">
                    <Badge variant={badgeVariantForStatus(broadcast.status)}>{labelForStatus(broadcast.status)}</Badge>
                    <Button type="button" variant="outline" onClick={handleSave} disabled={saving || broadcastLocked}>
                      <Save className="h-4 w-4" />
                      {saving ? "Guardando…" : "Guardar"}
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={broadcastLocked}>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="audience">Audiencia</TabsTrigger>
                    <TabsTrigger value="template">Template</TabsTrigger>
                    <TabsTrigger value="send">Enviar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="audience" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Audiencia guardada</p>
                        {audiences.length > 0 ? (
                          <Select
                            value={broadcast.audienceId || ""}
                            onValueChange={(value) => updateLocalBroadcast({ audienceId: value })}
                            disabled={broadcastLocked}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una audiencia" />
                            </SelectTrigger>
                            <SelectContent>
                              {audiences.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.sources.length} fuentes)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Aún no tienes audiencias. Crea una en la sección de newsletter.
                          </div>
                        )}
                      </div>

                      <div className="flex items-end">
                        <Button asChild variant="outline">
                          <Link to="/newsletter/audiences">Administrar audiencias</Link>
                        </Button>
                      </div>
                    </div>

                    {audiencePreview ? (
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant="secondary">Únicos: {audiencePreview.uniqueRecipientsCount}</Badge>
                          <Badge variant="outline">Raw: {audiencePreview.rawRecipientsCount}</Badge>
                          <Badge variant="outline">Deduplicados: {audiencePreview.deduplicatedCount}</Badge>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {audiencePreview.sourceSummaries.map((summary) => (
                            <div key={summary.key} className="rounded-lg border bg-background p-3 text-sm">
                              <div className="font-medium">{summary.label}</div>
                              <div className="text-muted-foreground">
                                {summary.uniqueCount} únicos de {summary.rawCount}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="template" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Template de email</p>
                        {templates.length > 0 ? (
                          <Select
                            value={broadcast.emailTemplateId || ""}
                            onValueChange={(value) => updateLocalBroadcast({ emailTemplateId: value })}
                            disabled={broadcastLocked}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            No tienes templates todavía.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCreateTemplate} disabled={creatingTemplate}>
                          <Plus className="h-4 w-4" />
                          {creatingTemplate ? "Creando…" : "Nuevo template"}
                        </Button>
                        {selectedTemplate ? (
                          <Button asChild variant="outline">
                            <Link to={`/email-templates/${selectedTemplate.id}/edit`}>
                              <Edit3 className="h-4 w-4" />
                              Editar template
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {selectedTemplate ? (
                      <>
                        <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                          <div className="font-medium">{selectedTemplate.name}</div>
                          <div className="mt-1 text-muted-foreground">
                            Subject: {selectedTemplate.subject || "—"}
                          </div>
                          <div className="text-muted-foreground">
                            Preheader: {selectedTemplate.preheader || "—"}
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border">
                          <div className="h-[980px]">
                            <EmailPreviewTab document={selectedTemplate.document} isActive={activeTab === "template"} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Selecciona un template para revisar el preview del correo.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="send" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Destinatarios</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>Total: {broadcast.totalRecipients || audiencePreview?.uniqueRecipientsCount || 0}</div>
                          <div>Enviados: {broadcast.sentRecipients}</div>
                          <div>Fallidos: {broadcast.failedRecipients}</div>
                          <div>Pendientes: {broadcast.pendingRecipients}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Audiencia</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          {broadcast.audienceName || "Selecciona una audiencia en la pestaña anterior."}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Template</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          {broadcast.emailTemplateName || "Selecciona un template en la pestaña anterior."}
                        </CardContent>
                      </Card>
                    </div>

                    {broadcast.lastError ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        {broadcast.lastError}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || broadcastLocked || !broadcast.audienceId || !selectedTemplate}
                      >
                        <Send className="h-4 w-4" />
                        {sending ? "Preparando…" : ["completed", "completed_with_errors", "failed"].includes(broadcast.status) ? "Reenviar" : "Enviar ahora"}
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/newsletter/contacts">Ir a listas y contactos</Link>
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Origen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingDetail ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                Cargando destinatarios…
                              </TableCell>
                            </TableRow>
                          ) : broadcast.recipients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                El snapshot de destinatarios aparecerá aquí al iniciar el envío.
                              </TableCell>
                            </TableRow>
                          ) : (
                            broadcast.recipients.map((recipient) => (
                              <TableRow key={recipient.id}>
                                <TableCell>{recipient.email}</TableCell>
                                <TableCell>{recipient.name || recipient.displayName || recipient.firstName || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={recipient.status === "sent" ? "success" : recipient.status === "failed" ? "destructive" : "outline"}>
                                    {recipient.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[320px] truncate">
                                  {recipient.errorMessage || recipient.sourceLabels.join(", ") || "—"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {["queued", "sending"].includes(broadcast.status) ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Esta pestaña se refresca automáticamente mientras el broadcast esté en progreso.
                      </div>
                    ) : null}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )

  if (embedded) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Newsletter Broadcasts</CardTitle>
              <CardDescription>
                Elige una audiencia guardada, selecciona un template y lanza el envío con seguimiento de progreso.
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleCreateBroadcast} disabled={creating}>
                <Plus className="h-4 w-4" />
                {creating ? "Creando…" : "Nuevo broadcast"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {content}
      </div>
    )
  }

  return (
    <div className="container mx-auto my-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Newsletter Broadcasts</CardTitle>
            <CardDescription>
              Elige una audiencia guardada, selecciona un template y lanza el envío con seguimiento de progreso.
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/newsletter/contacts">Volver a newsletter</Link>
            </Button>
            <Button type="button" onClick={handleCreateBroadcast} disabled={creating}>
              <Plus className="h-4 w-4" />
              {creating ? "Creando…" : "Nuevo broadcast"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {content}
    </div>
  )
}

export default NewsletterBroadcastsManager
