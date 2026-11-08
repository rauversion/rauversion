import { destroy, get, post, put } from "@rails/request.js"

import { normalizeEmailBlock, normalizeEmailDocument } from "./normalizers"
import type { EmailBlock, EmailBlockType, EmailDocument } from "./types"

export interface EmailTemplateRecord {
  id: string
  name: string
  subject: string
  preheader: string
  published: boolean
  document: EmailDocument
  updatedAt: string
  createdAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeTemplateRecord(value: unknown): EmailTemplateRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid email template payload")
  }

  return {
    id: String(value.id ?? ""),
    name: typeof value.name === "string" ? value.name : "Nuevo correo",
    subject: typeof value.subject === "string" ? value.subject : "",
    preheader: typeof value.preheader === "string" ? value.preheader : "",
    published: Boolean(value.published),
    document: normalizeEmailDocument(value.document, typeof value.name === "string" ? value.name : "Nuevo correo"),
    updatedAt: String(value.updatedAt ?? ""),
    createdAt: String(value.createdAt ?? ""),
  }
}

export async function fetchEmailTemplates(): Promise<EmailTemplateRecord[]> {
  const response = await get("/email-templates.json", { responseKind: "json" })

  if (!response.ok) {
    throw new Error("No se pudieron cargar las plantillas de email")
  }

  const payload = await response.json
  const templates = isRecord(payload) && Array.isArray(payload.templates) ? payload.templates : []
  return templates.map((item) => normalizeTemplateRecord(item))
}

export async function fetchEmailTemplate(id: string): Promise<EmailTemplateRecord> {
  const response = await get(`/email-templates/${id}.json`, { responseKind: "json" })

  if (!response.ok) {
    throw new Error("No se pudo cargar la plantilla de email")
  }

  const payload = await response.json
  return normalizeTemplateRecord(isRecord(payload) ? payload.template : null)
}

interface SaveEmailTemplateInput {
  name: string
  subject: string
  preheader: string
  document: EmailDocument
}

export async function createEmailTemplate(input: SaveEmailTemplateInput): Promise<EmailTemplateRecord> {
  const response = await post("/email-templates.json", {
    body: JSON.stringify({
      email_template: input,
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo crear la plantilla de email")
  }

  const payload = await response.json
  return normalizeTemplateRecord(isRecord(payload) ? payload.template : null)
}

export async function updateEmailTemplate(id: string, input: SaveEmailTemplateInput): Promise<EmailTemplateRecord> {
  const response = await put(`/email-templates/${id}.json`, {
    body: JSON.stringify({
      email_template: input,
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo guardar la plantilla de email")
  }

  const payload = await response.json
  return normalizeTemplateRecord(isRecord(payload) ? payload.template : null)
}

export async function destroyEmailTemplate(id: string): Promise<void> {
  const response = await destroy(`/email-templates/${id}.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo eliminar la plantilla de email")
  }
}

export type EmailCopilotSuggestion =
  | { mode: "draft" | "reminder"; subject: string; preheader: string; blocks: EmailBlock[] }
  | { mode: "block"; blocks: EmailBlock[] }
  | { mode: "rewrite"; body: string }
  | EmailCopilotEdit

export interface EmailCopilotEditorContext {
  name: string
  subject: string
  preheader: string
  selected_block_id?: string
  blocks: Array<{
    id: string
    type: EmailBlockType
    fields: Array<{ key: string; text: string }>
    assets: Array<{ kind: "link" | "image"; url: string; label: string }>
  }>
}

export interface EmailCopilotMessage {
  role: "user" | "assistant"
  text: string
}

export interface EmailCopilotEdit {
  mode: "edit"
  message: string
  subject: string | null
  preheader: string | null
  changes: Array<
    { action: "update"; blockId: string; field: string; value: string } |
    { action: "insert"; after: string; block: EmailBlock }
  >
}

export interface CopilotEventOption {
  id: string
  title: string
  startsAt: string
}

export async function fetchCopilotEvents(): Promise<CopilotEventOption[]> {
  const response = await get("/newsletter/copilot/events.json", { responseKind: "json" })
  if (!response.ok) throw new Error("No se pudieron cargar tus eventos.")

  const payload = await response.json
  if (!isRecord(payload) || !Array.isArray(payload.events)) throw new Error("No se pudieron cargar tus eventos.")

  return payload.events.filter(isRecord).map((event) => ({ id: String(event.id), title: String(event.title), startsAt: String(event.starts_at || "") }))
}

export async function generateEmailSuggestion(input: {
  mode: EmailCopilotSuggestion["mode"]
  prompt: string
  originalText?: string
  eventId?: string
  blockType?: EmailBlockType
  editorContext?: EmailCopilotEditorContext
  history?: EmailCopilotMessage[]
}): Promise<EmailCopilotSuggestion> {
  const response = await post("/newsletter/copilot.json", {
    body: JSON.stringify({ newsletter_copilot: {
      mode: input.mode,
      prompt: input.prompt,
      original_text: input.originalText,
      event_id: input.eventId,
      block_type: input.blockType,
      editor_context: input.editorContext,
      history: input.history,
    } }),
    responseKind: "json",
  })
  const payload = await response.json
  const fallback = "No se pudo generar una propuesta. Intenta de nuevo."

  if (!response.ok) {
    const errors = isRecord(payload) && Array.isArray(payload.errors) ? payload.errors : []
    throw new Error(errors.join(" ") || fallback)
  }

  const suggestion = isRecord(payload) ? payload.suggestion : null
  if (!isRecord(suggestion) || suggestion.mode !== input.mode) throw new Error(fallback)

  const { body, subject, preheader } = suggestion
  if (input.mode === "edit") {
    if (typeof suggestion.message !== "string" || (subject !== null && typeof subject !== "string") ||
      (preheader !== null && typeof preheader !== "string") || !Array.isArray(suggestion.changes)) throw new Error(fallback)

    const changes = suggestion.changes.map((change): EmailCopilotEdit["changes"][number] => {
      if (isRecord(change) && change.action === "update" && typeof change.block_id === "string" && typeof change.field === "string" && typeof change.value === "string") {
        return { action: "update", blockId: change.block_id, field: change.field, value: change.value }
      }
      if (isRecord(change) && change.action === "insert" && typeof change.after === "string") {
        const block = normalizeEmailBlock(change.block)
        if (block) return { action: "insert", after: change.after, block }
      }
      throw new Error(fallback)
    })
    return { mode: "edit", message: suggestion.message, subject, preheader, changes }
  }
  if (input.mode === "rewrite") {
    if (typeof body !== "string") throw new Error(fallback)
    return { mode: "rewrite", body }
  }

  if (!Array.isArray(suggestion.blocks) || suggestion.blocks.length === 0) throw new Error(fallback)
  const blocks = suggestion.blocks.map(normalizeEmailBlock).filter((block): block is EmailBlock => block !== null)
  if (blocks.length !== suggestion.blocks.length) throw new Error(fallback)

  if (input.mode === "block") {
    if (blocks.length !== 1 || blocks[0].type !== input.blockType) throw new Error(fallback)
    return { mode: "block", blocks }
  }

  if (typeof subject !== "string" || typeof preheader !== "string") throw new Error(fallback)
  return { mode: input.mode, subject, preheader, blocks }
}

export interface EmailPreviewResult {
  html: string
  errors: Array<Record<string, unknown> | string>
}

export async function compileEmailPreview(mjml: string): Promise<EmailPreviewResult> {
  const response = await post("/email-templates/preview.json", {
    body: JSON.stringify({ mjml }),
    responseKind: "json",
  })

  const payload = await response.json

  if (!response.ok) {
    const errors = isRecord(payload) && Array.isArray(payload.errors) ? payload.errors : ["No se pudo generar el preview"]
    throw new Error(errors.map((item) => String(item)).join(", "))
  }

  return {
    html: isRecord(payload) && typeof payload.html === "string" ? payload.html : "",
    errors: isRecord(payload) && Array.isArray(payload.errors) ? payload.errors as EmailPreviewResult["errors"] : [],
  }
}

interface SendEmailTestInput {
  toEmail: string
  subject: string
  templateName: string
  mjml: string
}

export interface EmailTestSendResult {
  status: "sent"
  message: string
  warnings: string[]
}

export async function sendEmailTest(input: SendEmailTestInput): Promise<EmailTestSendResult> {
  const response = await post("/email-templates/test_send.json", {
    body: JSON.stringify({
      to_email: input.toEmail,
      subject: input.subject,
      template_name: input.templateName,
      mjml: input.mjml,
    }),
    responseKind: "json",
  })

  const payload = await response.json

  if (!response.ok) {
    const errors = isRecord(payload) && Array.isArray(payload.errors) ? payload.errors : ["No se pudo enviar el correo de prueba"]
    throw new Error(errors.map((item) => String(item)).join(", "))
  }

  return {
    status: "sent",
    message: isRecord(payload) && typeof payload.message === "string" ? payload.message : "Correo de prueba enviado",
    warnings: isRecord(payload) && Array.isArray(payload.warnings) ? payload.warnings.map((warning) => String(warning)) : [],
  }
}
