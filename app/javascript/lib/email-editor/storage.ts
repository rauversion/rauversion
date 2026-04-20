import type { EmailDocument } from "./types"

const STORAGE_KEY = "email-editor:document"

function getStorageKey(namespace?: string | null): string {
  return namespace ? `${STORAGE_KEY}:${namespace}` : STORAGE_KEY
}

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function setToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn("Could not persist email editor draft", error)
  }
}

export function saveEmailDocument(document: EmailDocument, namespace?: string | null) {
  setToStorage(getStorageKey(namespace), document)
}

export function loadEmailDocument(namespace?: string | null): EmailDocument | null {
  return getFromStorage<EmailDocument | null>(getStorageKey(namespace), null)
}

export function clearEmailDocumentStorage(namespace?: string | null) {
  if (typeof window === "undefined") return

  localStorage.removeItem(getStorageKey(namespace))
}
