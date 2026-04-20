import React from "react"
import { Eye, Plus, Save, Trash2, Users } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import {
  createNewsletterAudience,
  destroyNewsletterAudience,
  fetchNewsletterAudiences,
  fetchNewsletterSourceOptions,
  previewNewsletterAudience,
  updateNewsletterAudience,
} from "@/lib/newsletter/api"
import type {
  NewsletterAudiencePreview,
  NewsletterAudienceRecord,
  NewsletterAudienceSourceInput,
  NewsletterAudienceSourceType,
  NewsletterSourceOptions,
} from "@/lib/newsletter/types"
import { cn } from "@/lib/utils"

function makeEmptyAudience() {
  return {
    id: "",
    name: "",
    updatedAt: "",
    createdAt: "",
    sources: [] as NewsletterAudienceSourceInput[],
  }
}

function defaultSettingsForType(type: NewsletterAudienceSourceType, sourceOptions: NewsletterSourceOptions) {
  switch (type) {
    case "contact_list":
      return { contactListId: sourceOptions.contactLists[0]?.id ?? "" }
    case "event_attendees":
      return { eventId: sourceOptions.events[0]?.id ?? "" }
    default:
      return {}
  }
}

export function AudiencesManager() {
  const { toast } = useToast()
  const [audiences, setAudiences] = React.useState<NewsletterAudienceRecord[]>([])
  const [selectedAudienceId, setSelectedAudienceId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<NewsletterAudienceRecord>(makeEmptyAudience())
  const [sourceOptions, setSourceOptions] = React.useState<NewsletterSourceOptions>({
    sourceTypes: [],
    contactLists: [],
    events: [],
    followerCount: 0,
  })
  const [preview, setPreview] = React.useState<NewsletterAudiencePreview | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [previewing, setPreviewing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const loadAudiences = React.useCallback(async () => {
    const nextAudiences = await fetchNewsletterAudiences()
    setAudiences(nextAudiences)
    return nextAudiences
  }, [])

  const loadSourceOptions = React.useCallback(async () => {
    setSourceOptions(await fetchNewsletterSourceOptions())
  }, [])

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [nextAudiences] = await Promise.all([loadAudiences(), loadSourceOptions()])
        setSelectedAudienceId(nextAudiences[0]?.id ?? null)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo cargar newsletter",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [loadAudiences, loadSourceOptions, toast])

  React.useEffect(() => {
    if (!selectedAudienceId) return

    const selected = audiences.find((audience) => audience.id === selectedAudienceId)
    if (selected) {
      setDraft({
        ...selected,
        sources: selected.sources.map((source) => ({ ...source })),
      })
      setPreview(null)
    }
  }, [audiences, selectedAudienceId])

  const handleNewAudience = () => {
    setSelectedAudienceId(null)
    setDraft(makeEmptyAudience())
    setPreview(null)
  }

  const updateDraftSource = (index: number, updates: Partial<NewsletterAudienceSourceInput>) => {
    setDraft((current) => {
      const nextSources = current.sources.map((source, sourceIndex) =>
        sourceIndex === index ? { ...source, ...updates } : source
      )

      return { ...current, sources: nextSources }
    })
    setPreview(null)
  }

  const handleSourceTypeChange = (index: number, sourceType: NewsletterAudienceSourceType) => {
    updateDraftSource(index, {
      sourceType,
      sourceSettings: defaultSettingsForType(sourceType, sourceOptions),
    })
  }

  const handleAddSource = () => {
    const fallbackType = sourceOptions.contactLists.length > 0 ? "contact_list" : "followers"

    setDraft((current) => ({
      ...current,
      sources: [
        ...current.sources,
        {
          sourceType: fallbackType,
          sourceSettings: defaultSettingsForType(fallbackType, sourceOptions),
        },
      ],
    }))
    setPreview(null)
  }

  const handleRemoveSource = (index: number) => {
    setDraft((current) => ({
      ...current,
      sources: current.sources.filter((_, sourceIndex) => sourceIndex !== index),
    }))
    setPreview(null)
  }

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      setPreview(await previewNewsletterAudience(draft.sources))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo calcular la audiencia",
        variant: "destructive",
      })
    } finally {
      setPreviewing(false)
    }
  }

  const handleSave = async () => {
    if (!draft.name.trim()) return

    setSaving(true)
    try {
      const saved = draft.id
        ? await updateNewsletterAudience(draft.id, { name: draft.name.trim(), sources: draft.sources })
        : await createNewsletterAudience({ name: draft.name.trim(), sources: draft.sources })

      const nextAudiences = await loadAudiences()
      setSelectedAudienceId(saved.id)
      setDraft(saved)
      setAudiences(nextAudiences)

      toast({
        title: draft.id ? "Audiencia actualizada" : "Audiencia creada",
        description: `${saved.name} quedó guardada.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la audiencia",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!draft.id) return
    if (!window.confirm(`Eliminar la audiencia "${draft.name}"?`)) return

    try {
      await destroyNewsletterAudience(draft.id)
      const nextAudiences = await loadAudiences()
      setSelectedAudienceId(nextAudiences[0]?.id ?? null)
      if (nextAudiences.length === 0) {
        setDraft(makeEmptyAudience())
        setPreview(null)
      }
      toast({
        title: "Audiencia eliminada",
        description: `${draft.name} se eliminó correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la audiencia",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Audiencias</CardTitle>
          <CardDescription>Combina followers, listas y asistentes para resolver destinatarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" className="w-full" onClick={handleNewAudience}>
            <Plus className="h-4 w-4" />
            Nueva audiencia
          </Button>

          <div className="space-y-2">
            {loading ? (
              <div className="py-6 text-sm text-muted-foreground">Cargando audiencias…</div>
            ) : audiences.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Todavía no tienes audiencias guardadas.
              </div>
            ) : (
              audiences.map((audience) => (
                <button
                  key={audience.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                    selectedAudienceId === audience.id ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                  )}
                  onClick={() => setSelectedAudienceId(audience.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{audience.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {audience.sources.length} fuentes
                      </div>
                    </div>
                    <Badge variant="outline">{audience.sources.length}</Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{draft.id ? "Editar audiencia" : "Nueva audiencia"}</CardTitle>
          <CardDescription>
            Usa preview para ver el total deduplicado antes de llegar a campañas y envíos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              value={draft.name}
              onChange={(event) => {
                setDraft((current) => ({ ...current, name: event.target.value }))
              }}
              placeholder="Nombre de la audiencia"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handlePreview} disabled={previewing || draft.sources.length === 0}>
                <Eye className="h-4 w-4" />
                {previewing ? "Calculando…" : "Preview"}
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving || !draft.name.trim()}>
                <Save className="h-4 w-4" />
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              {draft.id ? (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {draft.sources.map((source, index) => (
              <div key={`${source.id ?? "new"}-${index}`} className="rounded-lg border p-4">
                <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <Select value={source.sourceType} onValueChange={(value) => handleSourceTypeChange(index, value as NewsletterAudienceSourceType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.sourceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {source.sourceType === "contact_list" ? (
                    sourceOptions.contactLists.length > 0 ? (
                      <Select
                        value={source.sourceSettings.contactListId || sourceOptions.contactLists[0]?.id}
                        onValueChange={(value) =>
                          updateDraftSource(index, {
                            sourceSettings: { contactListId: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una lista" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.contactLists.map((contactList) => (
                            <SelectItem key={contactList.id} value={contactList.id}>
                              {contactList.name} ({contactList.contactsCount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        Primero crea una lista de contactos.
                      </div>
                    )
                  ) : null}

                  {source.sourceType === "event_attendees" ? (
                    sourceOptions.events.length > 0 ? (
                      <Select
                        value={source.sourceSettings.eventId || sourceOptions.events[0]?.id}
                        onValueChange={(value) =>
                          updateDraftSource(index, {
                            sourceSettings: { eventId: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        No tienes eventos propios todavía.
                      </div>
                    )
                  ) : null}

                  {source.sourceType === "followers" ? (
                    <div className="flex items-center rounded-md border px-3 text-sm text-muted-foreground">
                      Followers disponibles: {sourceOptions.followerCount}
                    </div>
                  ) : null}

                  {source.sourceType === "all_my_event_attendees" ? (
                    <div className="flex items-center rounded-md border px-3 text-sm text-muted-foreground">
                      Mezcla asistentes de todos tus eventos propios.
                    </div>
                  ) : null}

                  <Button type="button" variant="ghost" onClick={() => handleRemoveSource(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddSource}>
              <Plus className="h-4 w-4" />
              Agregar fuente
            </Button>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Preview de destinatarios
            </div>

            {!preview ? (
              <div className="text-sm text-muted-foreground">
                Ejecuta preview para calcular el total deduplicado y revisar una muestra de destinatarios.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Unicos: {preview.uniqueRecipientsCount}</Badge>
                  <Badge variant="outline">Raw: {preview.rawRecipientsCount}</Badge>
                  <Badge variant="outline">Deduplicados: {preview.deduplicatedCount}</Badge>
                </div>

                {preview.warnings.length > 0 ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {preview.warnings.join(" · ")}
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2">
                  {preview.sourceSummaries.map((summary) => (
                    <div key={summary.key} className="rounded-lg border bg-background p-3 text-sm">
                      <div className="font-medium">{summary.label}</div>
                      <div className="text-muted-foreground">
                        {summary.uniqueCount} unicos de {summary.rawCount} registros
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Origen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.recipients.slice(0, 50).map((recipient) => (
                        <TableRow key={recipient.email}>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>{recipient.name || recipient.displayName || recipient.firstName || "—"}</TableCell>
                          <TableCell className="max-w-[320px] truncate">{recipient.sourceLabels.join(", ") || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {preview.recipients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                            Esta audiencia no resolvió destinatarios.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>

                {preview.recipients.length > 50 ? (
                  <div className="text-xs text-muted-foreground">
                    Mostrando los primeros 50 destinatarios de {preview.uniqueRecipientsCount}.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
