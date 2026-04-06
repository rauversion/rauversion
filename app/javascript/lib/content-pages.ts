import { get, put } from "@rails/request.js"
import type { Page as EditorPage } from "@/lib/blocks/types"

export interface ContentPageRecord {
  id: string
  title: string
  slug: string
  published: boolean
  menu?: string | null
  body: unknown
  settings?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function normalizeContentPageBody(value: unknown): EditorPage[] {
  return Array.isArray(value) ? (value as EditorPage[]) : []
}

export function hasLegacyContentPageBody(value: unknown): boolean {
  return isRecord(value) && !Array.isArray(value) && Object.keys(value).length > 0
}

export async function fetchContentPage(idOrSlug: string): Promise<ContentPageRecord> {
  const response = await get(`/pages/${idOrSlug}.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo cargar la pagina")
  }

  return await response.json as ContentPageRecord
}

export async function saveContentPageBody(pageId: string, body: EditorPage[]): Promise<void> {
  const response = await put(`/pages/${pageId}.json`, {
    body: JSON.stringify({
      page: {
        body,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo guardar la pagina")
  }
}
