import type { Page, Template, Block } from "./blocks/types"

const STORAGE_KEYS = {
  pages: "release-editor:pages",
  templates: "release-editor:templates",
  currentPageId: "release-editor:current",
} as const

type EditorStorageNamespace = string | null | undefined

function getStorageKey(
  key: keyof Pick<typeof STORAGE_KEYS, "pages" | "currentPageId">,
  namespace?: EditorStorageNamespace
): string {
  return namespace ? `${STORAGE_KEYS[key]}:${namespace}` : STORAGE_KEYS[key]
}

// Check if a string is a data URL (base64 image)
function isDataUrl(str: string): boolean {
  return typeof str === "string" && str.startsWith("data:")
}

// Strip data URLs from blocks before saving (images only persist in session)
function stripImagesFromBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const stripped = { ...block }

    if (block.type === "image" && isDataUrl(block.props.src)) {
      stripped.props = { ...block.props, src: "" }
    }

    if (block.type === "card" && block.props.image && isDataUrl(block.props.image)) {
      stripped.props = { ...block.props, image: "" }
    }

    if (block.type === "custom-player" && isDataUrl(block.props.coverImage || "")) {
      stripped.props = { ...block.props, coverImage: "" }
    }

    // Handle column children recursively
    if (block.type === "column" && block.children) {
      ;(stripped as typeof block).children = stripImagesFromBlocks(block.children)
    }

    return stripped
  }) as Block[]
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function setToStorage<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Clearing storage...")
      clearAllStorage()
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

// Clear all editor storage
export function clearAllStorage(namespace?: EditorStorageNamespace): void {
  if (typeof window === "undefined") return

  if (namespace) {
    localStorage.removeItem(getStorageKey("pages", namespace))
    localStorage.removeItem(getStorageKey("currentPageId", namespace))
    return
  }

  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key)
  }
}

// Pages - strip images before saving (they only exist in session memory)
export function savePages(pages: Page[], namespace?: EditorStorageNamespace): void {
  const strippedPages = pages.map((page) => ({
    ...page,
    blocks: stripImagesFromBlocks(page.blocks),
  }))
  setToStorage(getStorageKey("pages", namespace), strippedPages)
}

export function loadPages(namespace?: EditorStorageNamespace): Page[] {
  return getFromStorage<Page[]>(getStorageKey("pages", namespace), [])
}

export function savePage(page: Page, namespace?: EditorStorageNamespace): void {
  const pages = loadPages(namespace)
  const index = pages.findIndex((p) => p.id === page.id)
  if (index >= 0) {
    pages[index] = { ...page, updatedAt: Date.now() }
  } else {
    pages.push(page)
  }
  savePages(pages, namespace)
}

export function loadPage(id: string, namespace?: EditorStorageNamespace): Page | null {
  const pages = loadPages(namespace)
  return pages.find((p) => p.id === id) || null
}

export function deletePage(id: string, namespace?: EditorStorageNamespace): void {
  const pages = loadPages(namespace)
  savePages(pages.filter((p) => p.id !== id), namespace)
}

// Current page
export function setCurrentPageId(id: string | null, namespace?: EditorStorageNamespace): void {
  if (id) {
    setToStorage(getStorageKey("currentPageId", namespace), id)
  } else if (typeof window !== "undefined") {
    localStorage.removeItem(getStorageKey("currentPageId", namespace))
  }
}

export function getCurrentPageId(namespace?: EditorStorageNamespace): string | null {
  return getFromStorage<string | null>(getStorageKey("currentPageId", namespace), null)
}

// Templates
export function saveTemplates(templates: Template[]): void {
  const strippedTemplates = templates.map((t) => ({
    ...t,
    page: {
      ...t.page,
      blocks: stripImagesFromBlocks(t.page.blocks),
    },
  }))
  setToStorage(STORAGE_KEYS.templates, strippedTemplates)
}

export function loadTemplates(): Template[] {
  return getFromStorage<Template[]>(STORAGE_KEYS.templates, [])
}

export function saveTemplate(template: Template): void {
  const templates = loadTemplates()
  const index = templates.findIndex((t) => t.id === template.id)
  if (index >= 0) {
    templates[index] = template
  } else {
    templates.push(template)
  }
  saveTemplates(templates)
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates()
  saveTemplates(templates.filter((t) => t.id !== id))
}

export function pageToTemplate(page: Page, name: string, description?: string): Template {
  return {
    id: `template-${Date.now()}`,
    name,
    description,
    page: {
      name: page.name,
      blocks: page.blocks,
      style: page.style,
    },
  }
}
