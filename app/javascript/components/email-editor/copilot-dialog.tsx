import React from "react"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fetchCopilotEvents, generateEmailSuggestion, type CopilotEventOption, type EmailCopilotMessage, type EmailCopilotSuggestion } from "@/lib/email-editor/api"
import { applyCopilotEdits, buildCopilotEditorContext, isStarterEmail, plainTextFromEmailHtml } from "@/lib/email-editor/copilot-content"
import { emailBlockRegistry, getEmailBlockEntry } from "@/lib/email-editor/registry"
import type { EmailBlockType, EmailDocument } from "@/lib/email-editor/types"
import { EmailBlockRenderer } from "./email-block-renderer"

interface EmailCopilotDialogProps {
  draft: EmailDocument
  initialEventId?: string
  selectedBlockId: string | null
  selectedTextHtml?: string
  onApply: (suggestion: Exclude<EmailCopilotSuggestion, { mode: "edit" }>) => void
  onApplyDraft: (draft: EmailDocument) => void
}

const modes = [
  { value: "edit", label: "Conversar" },
  { value: "draft", label: "Crear desde cero" },
  { value: "reminder", label: "Recordatorio de pago" },
  { value: "block", label: "Generar bloque" },
  { value: "rewrite", label: "Reescribir bloque" },
] as const

export function EmailCopilotDialog({ draft, initialEventId, selectedBlockId, selectedTextHtml, onApply, onApplyDraft }: EmailCopilotDialogProps) {
  const defaultMode = initialEventId ? "reminder" : "edit"
  const [open, setOpen] = React.useState(Boolean(initialEventId))
  const [mode, setMode] = React.useState<EmailCopilotSuggestion["mode"]>(defaultMode)
  const [eventId, setEventId] = React.useState(initialEventId || "")
  const [events, setEvents] = React.useState<CopilotEventOption[] | null>(null)
  const [eventError, setEventError] = React.useState("")
  const [blockType, setBlockType] = React.useState<EmailBlockType>("text")
  const [prompt, setPrompt] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [suggestion, setSuggestion] = React.useState<Exclude<EmailCopilotSuggestion, { mode: "edit" }> | null>(null)
  const [pending, setPending] = React.useState<{ base: EmailDocument; draft: EmailDocument } | null>(null)
  const [messages, setMessages] = React.useState<EmailCopilotMessage[]>([])
  const requestId = React.useRef(0)
  const conversationRef = React.useRef<HTMLDivElement>(null)
  const promptId = React.useId()
  const eventFieldId = React.useId()
  const blockFieldId = React.useId()
  const originalText = React.useMemo(() => selectedTextHtml ? plainTextFromEmailHtml(selectedTextHtml) : "", [selectedTextHtml])
  const conversational = mode === "edit" || mode === "reminder"
  const review = pending?.base === draft ? pending : null
  const previousBlocks = new Map(draft.blocks.map((block) => [block.id, block]))
  const changedBlocks = review?.draft.blocks.filter((block) => {
    const previous = previousBlocks.get(block.id)
    return !previous || JSON.stringify(previous) !== JSON.stringify(block)
  }) || []
  const subjectChanged = Boolean(review && review.draft.subject !== draft.subject)
  const preheaderChanged = Boolean(review && review.draft.preheader !== draft.preheader)
  const replacedStarter = Boolean(review && draft.blocks.some((block) => !review.draft.blocks.some((item) => item.id === block.id)))
  const hasChanges = changedBlocks.length > 0 || subjectChanged || preheaderChanged || replacedStarter

  React.useEffect(() => {
    const panel = conversationRef.current
    if (panel) panel.scrollTop = panel.scrollHeight
  }, [messages, open, mode])

  React.useEffect(() => {
    if (!open || mode !== "reminder" || events) return

    let cancelled = false
    setEventError("")
    fetchCopilotEvents().then((result) => {
      if (cancelled) return
      setEvents(result)
      setEventId((current) => result.some((event) => event.id === current) ? current : "")
    }).catch(() => {
      if (!cancelled) setEventError("No se pudieron cargar tus eventos. Vuelve a abrir el copiloto para reintentar.")
    })

    return () => { cancelled = true }
  }, [events, mode, open])

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) return

    requestId.current += 1
    setLoading(false)
    setSuggestion(null)
    setError("")
    setPrompt("")
    setMode(defaultMode)
  }

  const changeMode = (nextMode: EmailCopilotSuggestion["mode"]) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setPrompt("")
    setSuggestion(null)
    setError("")
  }

  const canGenerate = mode === "rewrite" ? Boolean(originalText)
    : mode === "reminder" ? Boolean(events?.some((event) => event.id === eventId)) && (!review || Boolean(prompt.trim()))
    : Boolean(prompt.trim()) || (mode === "block" && ["divider", "spacer"].includes(blockType))
  const promptLabel = mode === "draft" ? "¿Qué quieres comunicar?"
    : mode === "edit" ? "¿Qué quieres hacer con este correo?"
    : mode === "reminder" ? review ? "¿Qué quieres ajustar del recordatorio?" : "Tono o instrucciones (opcional)"
    : mode === "block" ? "¿Qué debe contener el bloque?"
    : "¿Qué quieres cambiar? (opcional)"
  const promptPlaceholder = mode === "draft" ? "Ej.: Anuncia el lanzamiento de un EP. Usa un título, una sección corta y un botón con este enlace…"
    : mode === "edit" ? "Ej.: Acorta la introducción y agrega un botón después del bloque de entradas."
    : mode === "reminder" ? "Ej.: Usa un tono cercano y mantén el mensaje breve."
    : mode === "block" ? "Ej.: Escribe una sección que presente el próximo lanzamiento."
    : "Ej.: Acorta el texto y usa un tono más cercano."

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || !canGenerate) return

    const id = ++requestId.current
    setLoading(true)
    setSuggestion(null)
    setError("")

    try {
      const workingDraft = review?.draft || draft
      const editReminder = mode === "reminder" && (review || !isStarterEmail(draft))
      const requestMode = editReminder ? "edit" : mode
      const userMessage = prompt.trim() || "Redacta un recordatorio de pago para este evento."
      const requestPrompt = editReminder && !review && messages.length === 0 && prompt.trim()
        ? `Adapta este correo como recordatorio de pago para el evento. ${userMessage}` : userMessage
      const result = await generateEmailSuggestion({
        mode: requestMode,
        prompt: conversational ? requestPrompt : prompt.trim(),
        originalText: mode === "rewrite" ? originalText : undefined,
        eventId: conversational && eventId ? eventId : undefined,
        blockType: mode === "block" ? blockType : undefined,
        editorContext: requestMode === "edit" ? buildCopilotEditorContext(workingDraft, selectedBlockId) : undefined,
        history: requestMode === "edit" ? messages.slice(-8) : undefined,
      })
      if (requestId.current !== id) return

      if (result.mode === "edit" || result.mode === "reminder") {
        const nextDraft = result.mode === "edit" ? applyCopilotEdits(workingDraft, result) : {
          ...draft, subject: result.subject, preheader: result.preheader, blocks: result.blocks,
        }
        if (result.mode === "reminder" || (result.mode === "edit" && (result.subject !== null || result.preheader !== null || result.changes.length > 0))) {
          setPending({ base: draft, draft: nextDraft })
        }
        setMessages((current) => [...current, { role: "user" as const, text: userMessage }, {
          role: "assistant" as const,
          text: result.mode === "edit" ? result.message : "Preparé una propuesta de recordatorio con los datos del evento.",
        }].slice(-12))
        setPrompt("")
      } else {
        setSuggestion(result)
      }
    } catch (error) {
      if (requestId.current === id) setError(error instanceof Error ? error.message : "No se pudo generar una propuesta.")
    } finally {
      if (requestId.current === id) setLoading(false)
    }
  }

  const finishReview = (apply: boolean) => {
    if (apply && review && hasChanges) onApplyDraft(review.draft)
    setPending(null)
    setMessages((current) => [...current, { role: "assistant" as const, text: apply
      ? "Cambios aplicados al borrador." : "Propuesta descartada. Seguimos con el borrador actual." }].slice(-12))
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="mr-1 h-4 w-4" />
          Copiloto
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Copiloto de newsletter</DialogTitle>
          <DialogDescription>Conversa sobre tu borrador y revisa los cambios antes de aplicarlos.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleGenerate}>
          <div className="flex flex-wrap gap-2">
            {modes.map((option) => (
              <Button key={option.value} type="button" size="sm" variant={mode === option.value ? "default" : "outline"}
                aria-pressed={mode === option.value} onClick={() => changeMode(option.value)}
                disabled={loading || (option.value === "rewrite" && !originalText)}>
                {option.label}
              </Button>
            ))}
          </div>

          {mode === "reminder" && (
            <div className="space-y-2">
              <Label htmlFor={eventFieldId}>Evento</Label>
              <select id={eventFieldId} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading || Boolean(initialEventId) || !events?.length} value={eventId} onChange={(event) => {
                  setEventId(event.target.value)
                  setSuggestion(null)
                  setPending(null)
                  setMessages([])
                  setError("")
                }}>
                <option value="">{events ? "Selecciona un evento" : eventError ? "Eventos no disponibles" : "Cargando eventos…"}</option>
                {events?.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}{event.startsAt ? ` · ${new Date(event.startsAt).toLocaleDateString()}` : ""}
                  </option>
                ))}
              </select>
              {eventError && <p role="alert" className="text-sm text-destructive">{eventError}</p>}
              {initialEventId && events && !eventId && <p role="alert" className="text-sm text-destructive">El evento de este broadcast no está disponible.</p>}
              {!initialEventId && events?.length === 0 && <p className="text-sm text-muted-foreground">No tienes eventos en este sitio.</p>}
              <p className="text-xs text-muted-foreground">El borrador se redacta para quienes tienen un pago pendiente. El envío usa la audiencia que elijas en el broadcast.</p>
            </div>
          )}

          {conversational && messages.length > 0 && (
            <div ref={conversationRef} aria-live="polite" aria-label="Conversación" className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3 text-sm">
              {messages.map((message, index) => (
                <p key={index} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                  <strong>{message.role === "user" ? "Tú: " : "Copiloto: "}</strong>{message.text}
                </p>
              ))}
            </div>
          )}

          {mode === "block" && (
            <div className="space-y-2">
              <Label htmlFor={blockFieldId}>Tipo de bloque</Label>
              <select id={blockFieldId} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading} value={blockType} onChange={(event) => {
                  setBlockType(event.target.value as EmailBlockType)
                  setSuggestion(null)
                  setError("")
                }}>
                {emailBlockRegistry.map((entry) => <option key={entry.type} value={entry.type}>{entry.label}</option>)}
              </select>
              {["button", "links", "image", "gallery"].includes(blockType) && (
                <p className="text-xs text-muted-foreground">Pega las URLs en la instrucción. Para una galería, incluye al menos dos enlaces directos a imágenes.</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={promptId}>{promptLabel}</Label>
            <Textarea
              id={promptId}
              value={prompt}
              maxLength={mode === "reminder" ? 2900 : 3000}
              rows={4}
              disabled={loading}
              placeholder={promptPlaceholder}
              onChange={(event) => {
                setPrompt(event.target.value)
                setSuggestion(null)
                setError("")
              }}
            />
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          {conversational && pending && !review && (
            <p className="text-sm text-muted-foreground">El borrador cambió desde la última propuesta. La próxima solicitud usará su versión actual.</p>
          )}

          {conversational && review && hasChanges && (
            <div aria-label="Cambios propuestos" className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Cambios propuestos</p>
              {replacedStarter && <p className="text-xs text-muted-foreground">El recordatorio sustituirá el contenido de ejemplo.</p>}
              {subjectChanged && <p className="text-sm"><strong>Asunto:</strong> {review.draft.subject}</p>}
              {preheaderChanged && <p className="text-sm"><strong>Preencabezado:</strong> {review.draft.preheader || "(vacío)"}</p>}
              {changedBlocks.map((block) => (
                <div key={block.id} className="space-y-2 rounded-md border bg-background p-3 [overflow-wrap:anywhere]">
                  <p className="text-xs font-medium text-muted-foreground">
                    {previousBlocks.has(block.id) ? "Editado" : "Nuevo"} · {getEmailBlockEntry(block.type)?.label}
                  </p>
                  <EmailBlockRenderer block={block} theme={draft.theme} isEditing />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Puedes pedir otro ajuste antes de aplicar la propuesta.</p>
            </div>
          )}

          {suggestion && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4" aria-live="polite">
              {(suggestion.mode === "draft" || suggestion.mode === "reminder") && (
                <div className="space-y-1 text-sm [overflow-wrap:anywhere]">
                  <p><strong>Asunto:</strong> {suggestion.subject}</p>
                  <p><strong>Preencabezado:</strong> {suggestion.preheader}</p>
                </div>
              )}
              {suggestion.mode === "rewrite" ? (
                <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{suggestion.body}</p>
              ) : suggestion.blocks.map((block) => (
                <div key={block.id} className="space-y-2 rounded-md border bg-background p-3 [overflow-wrap:anywhere]">
                  <p className="text-xs font-medium text-muted-foreground">{getEmailBlockEntry(block.type)?.label}</p>
                  <EmailBlockRenderer block={block} theme={draft.theme} isEditing />
                </div>
              ))}
              <p className="border-t pt-3 text-xs text-muted-foreground">
                {suggestion.mode === "rewrite"
                  ? "Al aplicar se reemplazarán el texto y el formato del bloque seleccionado. Puedes deshacer el cambio."
                  : suggestion.mode === "block"
                    ? "El bloque se inserta después del seleccionado o al final del correo."
                    : "Al aplicar se reemplazarán el asunto, el preencabezado y los bloques actuales. Puedes deshacer el cambio."}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" variant={suggestion || (conversational && hasChanges) ? "outline" : "default"} disabled={loading || !canGenerate}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {loading ? "Generando…" : mode === "edit" || (conversational && review) ? "Enviar al copiloto" : suggestion ? "Generar otra versión" : "Generar propuesta"}
            </Button>
            {conversational && review && hasChanges && (
              <>
                <Button type="button" variant="ghost" disabled={loading} onClick={() => finishReview(false)}>Descartar</Button>
                <Button type="button" disabled={loading} onClick={() => finishReview(true)}>Aplicar cambios</Button>
              </>
            )}
            {suggestion && (
              <Button type="button" onClick={() => { onApply(suggestion); changeOpen(false) }}>
                {suggestion.mode === "rewrite" ? "Aplicar al bloque" : suggestion.mode === "block" ? "Insertar bloque" : "Aplicar borrador"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
