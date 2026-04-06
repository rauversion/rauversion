import type { Page, Template, Block } from "@/lib/blocks/types"

export interface EditorTemplateRecord extends Template {
  category?: string
  userId?: number | null
}

const DEFAULT_PAGE_STYLE: Template["page"]["style"] = {
  primaryColor: "#6366f1",
  template: "minimal",
  darkMode: true,
  fontFamily: "sans",
}

function getCsrfToken(): string {
  if (typeof document === "undefined") return ""

  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizePage(page: unknown, fallbackName: string): Template["page"] {
  const value = isRecord(page) ? page : {}
  const style = isRecord(value.style) ? value.style : {}

  return {
    name: typeof value.name === "string" ? value.name : fallbackName,
    blocks: Array.isArray(value.blocks) ? (value.blocks as Block[]) : [],
    style: {
      ...DEFAULT_PAGE_STYLE,
      ...style,
    },
  }
}

function normalizeTemplate(template: unknown): EditorTemplateRecord {
  const value = isRecord(template) ? template : {}
  const name = typeof value.name === "string" ? value.name : "Plantilla"

  return {
    id: typeof value.id === "string" || typeof value.id === "number" ? String(value.id) : "",
    name,
    description: typeof value.description === "string" ? value.description : undefined,
    thumbnail: typeof value.thumbnail === "string" ? value.thumbnail : undefined,
    category: typeof value.category === "string" ? value.category : undefined,
    userId: typeof value.userId === "number" ? value.userId : null,
    page: normalizePage(value.page, name),
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (isRecord(data) && Array.isArray(data.errors) && data.errors.length > 0) {
    const [firstError] = data.errors
    if (typeof firstError === "string" && firstError.length > 0) {
      return firstError
    }
  }

  if (isRecord(data) && typeof data.error === "string" && data.error.length > 0) {
    return data.error
  }

  return fallback
}

async function parseResponse(response: Response, fallbackMessage: string): Promise<unknown> {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, fallbackMessage))
  }

  return data
}

function isDataUrl(value: string): boolean {
  return value.startsWith("data:")
}

function sanitizeBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const sanitized = { ...block }

    if (block.type === "image" && isDataUrl(block.props.src)) {
      sanitized.props = { ...block.props, src: "" }
    }

    if (block.type === "card" && block.props.image && isDataUrl(block.props.image)) {
      sanitized.props = { ...block.props, image: "" }
    }

    if (block.type === "custom-player" && isDataUrl(block.props.coverImage || "")) {
      sanitized.props = { ...block.props, coverImage: "" }
    }

    if (block.type === "column" && block.children) {
      ;(sanitized as typeof block).children = sanitizeBlocks(block.children)
    }

    if (block.type === "carousel" && block.slides) {
      ;(sanitized as typeof block).slides = block.slides.map((slide) => ({
        ...slide,
        blocks: sanitizeBlocks(slide.blocks),
      }))
    }

    return sanitized
  }) as Block[]
}

function sanitizePage(page: Page): Template["page"] {
  return {
    name: page.name,
    blocks: sanitizeBlocks(page.blocks),
    style: page.style,
  }
}

export async function fetchEditorTemplates(category: string): Promise<EditorTemplateRecord[]> {
  const response = await fetch(`/editor_templates.json?category=${encodeURIComponent(category)}`, {
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  })

  const data = await parseResponse(response, "No se pudieron cargar las plantillas")
  const templates = isRecord(data) && Array.isArray(data.templates) ? data.templates : []

  return templates.map(normalizeTemplate)
}

interface CreateEditorTemplateParams {
  category: string
  page: Page
  name: string
  description?: string
}

export async function createEditorTemplate({
  category,
  page,
  name,
  description,
}: CreateEditorTemplateParams): Promise<EditorTemplateRecord> {
  const response = await fetch("/editor_templates.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": getCsrfToken(),
    },
    credentials: "same-origin",
    body: JSON.stringify({
      editor_template: {
        category,
        name,
        description,
        page_data: sanitizePage(page),
      },
    }),
  })

  const data = await parseResponse(response, "No se pudo guardar la plantilla")
  const template = isRecord(data) ? data.template : null

  return normalizeTemplate(template)
}

export async function destroyEditorTemplate(id: string): Promise<void> {
  const response = await fetch(`/editor_templates/${id}.json`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": getCsrfToken(),
    },
    credentials: "same-origin",
  })

  if (response.ok) return

  const data = await response.json().catch(() => ({}))
  throw new Error(extractErrorMessage(data, "No se pudo eliminar la plantilla"))
}
