import { destroy, get, post, put } from "@rails/request.js"

import { normalizeEmailDocument } from "./normalizers"
import type { EmailDocument } from "./types"

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
