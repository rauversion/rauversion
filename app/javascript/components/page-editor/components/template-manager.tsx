"use client"

import React from "react"
import { useState, useEffect } from "react"
import type { Page, Template } from "@/lib/blocks/types"
import {
  fetchEditorTemplates,
  createEditorTemplate,
  destroyEditorTemplate,
  type EditorTemplateRecord,
} from "@/lib/editor-templates"
import { createNewPage } from "@/lib/blocks/defaults"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, FolderOpen, Trash2, FileText, Sparkles, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { nanoid } from "nanoid"

interface TemplateManagerProps {
  category: string
  currentPage: Page
  onApplyTemplate: (page: Page) => void
  onClearHistory?: () => void
}

export function TemplateManager({
  category,
  currentPage,
  onApplyTemplate,
  onClearHistory,
}: TemplateManagerProps) {
  const [globalTemplates, setGlobalTemplates] = useState<EditorTemplateRecord[]>([])
  const [userTemplates, setUserTemplates] = useState<EditorTemplateRecord[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadTemplates = async () => {
      setIsLoadingTemplates(true)
      setTemplatesError(null)

      try {
        const templates = await fetchEditorTemplates(category)

        if (cancelled) return

        setGlobalTemplates(templates.filter((template) => !template.userId))
        setUserTemplates(templates.filter((template) => !!template.userId))
      } catch (error) {
        if (cancelled) return

        setGlobalTemplates([])
        setUserTemplates([])
        setTemplatesError(error instanceof Error ? error.message : "No se pudieron cargar las plantillas")
      } finally {
        if (!cancelled) {
          setIsLoadingTemplates(false)
        }
      }
    }

    loadTemplates()

    return () => {
      cancelled = true
    }
  }, [category])

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return

    try {
      const template = await createEditorTemplate({
        category,
        page: currentPage,
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
      })

      setUserTemplates((prev) => [...prev, template])
      setTemplateName("")
      setTemplateDescription("")
      setSaveDialogOpen(false)
      setTemplatesError(null)
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : "No se pudo guardar la plantilla")
    }
  }

  const handleSelectTemplate = (template: Template) => {
    if (currentPage.blocks.length > 0) {
      setPendingTemplate(template)
      setConfirmDialogOpen(true)
    } else {
      applyTemplate(template)
    }
  }

  const applyTemplate = (template: Template) => {
    const newPage = createNewPage(template.page.name)
    newPage.blocks = template.page.blocks.map((block) => ({
      ...JSON.parse(JSON.stringify(block)),
      id: nanoid(),
    }))
    newPage.style = { ...template.page.style }
    onApplyTemplate(newPage)
    onClearHistory?.()
    setLoadDialogOpen(false)
    setConfirmDialogOpen(false)
    setPendingTemplate(null)
  }

  const handleConfirmReplace = () => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await destroyEditorTemplate(id)
      setUserTemplates((prev) => prev.filter((template) => template.id !== id))
      setTemplatesError(null)
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : "No se pudo eliminar la plantilla")
    }
  }

  const TemplateCard = ({
    template,
    showDelete = false,
    isDefault = false,
  }: {
    template: Template
    showDelete?: boolean
    isDefault?: boolean
  }) => (
    <div
      className={cn(
        "group relative flex flex-col p-4 border rounded-xl hover:border-primary/50 transition-all cursor-pointer",
        isDefault && "bg-gradient-to-br from-primary/5 to-transparent"
      )}
      onClick={() => handleSelectTemplate(template)}
    >
      {isDefault && (
        <div className="absolute top-2 right-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}
      <h4 className="font-medium mb-1">{template.name}</h4>
      {template.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {template.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-xs text-muted-foreground">
          {template.page.blocks.length} bloques
        </span>
        {showDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteTemplate(template.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  const TemplatesEmptyState = ({
    title,
    description,
  }: {
    title: string
    description?: string
  }) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FileText className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  )

  return (
    <>
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reemplazar contenido
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion reemplazara todo el contenido actual de la pagina con la plantilla seleccionada.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTemplate(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Reemplazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2">
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Guardar plantilla</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar como plantilla</DialogTitle>
              <DialogDescription>
                Guarda tu pagina actual como una plantilla reutilizable
              </DialogDescription>
            </DialogHeader>
            {templatesError && (
              <p className="text-sm text-destructive">{templatesError}</p>
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Mi plantilla de lanzamiento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion (opcional)</Label>
                <Textarea
                  id="description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Una breve descripcion de la plantilla..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Plantillas</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Seleccionar plantilla</DialogTitle>
              <DialogDescription>
                Elige una plantilla global o una de tus plantillas guardadas
              </DialogDescription>
            </DialogHeader>
            {templatesError && (
              <p className="text-sm text-destructive">{templatesError}</p>
            )}
            <Tabs defaultValue="default" className="py-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="default">Predefinidas</TabsTrigger>
                <TabsTrigger value="saved">Mis Plantillas</TabsTrigger>
              </TabsList>
              <TabsContent value="default">
                <ScrollArea className="h-[360px] pr-4">
                  {isLoadingTemplates ? (
                    <TemplatesEmptyState title="Cargando plantillas..." />
                  ) : globalTemplates.length === 0 ? (
                    <TemplatesEmptyState title="No hay plantillas globales" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 py-2">
                      {globalTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isDefault
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="saved">
                <ScrollArea className="h-[360px] pr-4">
                  {isLoadingTemplates ? (
                    <TemplatesEmptyState title="Cargando plantillas..." />
                  ) : userTemplates.length === 0 ? (
                    <TemplatesEmptyState
                      title="No hay plantillas guardadas"
                      description="Guarda tu primera plantilla desde el editor"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 py-2">
                      {userTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          showDelete
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
