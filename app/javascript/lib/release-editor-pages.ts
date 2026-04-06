import { get, put } from "@rails/request.js"
import type { Page } from "@/lib/blocks/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function normalizeReleasePages(value: unknown): Page[] {
  return Array.isArray(value) ? (value as Page[]) : []
}

export async function fetchReleasePages(releaseId: string): Promise<Page[]> {
  const response = await get(`/releases/${releaseId}.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar las paginas del release")
  }

  const releaseData = await response.json
  const editorData = isRecord(releaseData) && isRecord(releaseData.editor_data)
    ? releaseData.editor_data
    : null

  return normalizeReleasePages(editorData?.pages)
}

export async function fetchAlbumPages(albumId: string): Promise<Page[]> {
  const response = await get(`/albums/${albumId}.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar las paginas del album")
  }

  const albumData = await response.json
  const editorData = isRecord(albumData) && isRecord(albumData.editor_data)
    ? albumData.editor_data
    : null

  return normalizeReleasePages(editorData?.pages)
}

export async function saveReleasePages(releaseId: string, pages: Page[]): Promise<void> {
  const response = await put(`/releases/${releaseId}.json`, {
    body: JSON.stringify({
      release: {
        pages,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudieron guardar las paginas del release")
  }
}
