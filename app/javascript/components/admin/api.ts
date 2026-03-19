import { destroy, get, patch, post } from "@rails/request.js"

async function readJson(response: any) {
  try {
    return await response.json
  } catch (_error) {
    return null
  }
}

async function unwrap<T>(response: any): Promise<T> {
  const data = await readJson(response)

  if (response.ok) {
    return data as T
  }

  const message =
    data?.error ||
    data?.message ||
    Object.values(data?.errors || {}).flat().join(", ") ||
    "Admin request failed"

  const error = new Error(message) as Error & { details?: Record<string, string[]> | null }
  error.details = data?.errors || null
  throw error
}

export async function adminGetJson<T>(path: string): Promise<T> {
  const response = await get(path, { responseKind: "json" })
  return unwrap<T>(response)
}

export async function adminPostJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await post(path, {
    responseKind: "json",
    body: body ? JSON.stringify(body) : undefined,
  })
  return unwrap<T>(response)
}

export async function adminPatchJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await patch(path, {
    responseKind: "json",
    body: body ? JSON.stringify(body) : undefined,
  })
  return unwrap<T>(response)
}

export async function adminDelete(path: string): Promise<void> {
  const response = await destroy(path, { responseKind: "json" })
  if (response.ok) return

  await unwrap(response)
}
