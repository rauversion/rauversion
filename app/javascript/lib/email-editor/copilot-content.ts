export function plainTextFromEmailHtml(html: string): string {
  const template = document.createElement("template")
  template.innerHTML = html
  template.content.querySelectorAll("script, style").forEach((element) => element.remove())
  template.content.querySelectorAll("br").forEach((element) => element.replaceWith("\n"))
  template.content.querySelectorAll("p, div, li, h1, h2, h3").forEach((element) => element.append("\n\n"))

  return (template.content.textContent || "").replace(/\n{3,}/g, "\n\n").trim()
}

export function plainTextToEmailHtml(text: string): string {
  const escaped = text.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return escaped.replace(/\r\n?/g, "\n").split(/\n[^\S\n]*\n+/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("")
}
import { createNewEmailDocument } from "./defaults"
import type { EmailCopilotEdit, EmailCopilotEditorContext } from "./api"
import type { EmailBlock, EmailBlockType, EmailDocument } from "./types"


const editableFields: Partial<Record<EmailBlockType, string[]>> = {
  heading: ["text", "subtitle"], text: ["content"], section: ["eyebrow", "title", "body", "ctaText"],
  bio: ["name", "role", "bio", "ctaText"], button: ["text"], image: ["alt"], links: ["title"],
}
const richFields: Partial<Record<EmailBlockType, string>> = { text: "content", section: "body" }
const starter = createNewEmailDocument()

export function isStarterEmail(document: EmailDocument) {
  const blocks = (items: EmailBlock[]) => JSON.stringify(items.map(({ type, props }) => ({ type, props })))
  return document.subject === starter.subject && !document.preheader &&
    (document.blocks.length === 0 || blocks(document.blocks) === blocks(starter.blocks))
}

function richTextRuns(html: string) {
  const template = document.createElement("template")
  template.innerHTML = html
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT)
  const runs: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text
    if (text.data.trim() && !text.parentElement?.closest("script, style")) runs.push(text)
  }
  return { template, runs }
}

function blockAssets(block: EmailBlock): EmailCopilotEditorContext["blocks"][number]["assets"] {
  const asset = (kind: "link" | "image", url?: string, label = "") => url ? [{ kind, url, label }] : []
  const richLinks = (html: string) => Array.from(richTextRuns(html).template.content.querySelectorAll("a[href]"))
    .flatMap((link) => asset("link", link.getAttribute("href") || undefined, link.textContent || ""))
  switch (block.type) {
    case "text": return richLinks(block.props.content)
    case "button": return asset("link", block.props.href, block.props.text)
    case "image": return [...asset("image", block.props.src, block.props.alt), ...asset("link", block.props.href, block.props.alt)]
    case "gallery": return block.props.images.flatMap((image) => asset("image", image.src, image.alt))
    case "links": return block.props.links.flatMap((link) => asset("link", link.url, link.label))
    case "section": return [...asset("image", block.props.image, block.props.title), ...asset("link", block.props.ctaUrl, block.props.ctaText), ...richLinks(block.props.body)]
    case "bio": return [...asset("image", block.props.image, block.props.name), ...asset("link", block.props.ctaUrl, block.props.ctaText)]
    default: return []
  }
}

export function buildCopilotEditorContext(draft: EmailDocument, selectedBlockId: string | null): EmailCopilotEditorContext {
  return {
    name: draft.name,
    subject: draft.subject,
    preheader: draft.preheader,
    selected_block_id: selectedBlockId && draft.blocks.some((block) => block.id === selectedBlockId) ? selectedBlockId : undefined,
    blocks: draft.blocks.map((block) => {
      const props = block.props as Record<string, unknown>
      const fields = (editableFields[block.type] || []).flatMap((key) => {
        const text = typeof props[key] === "string" ? props[key] as string : ""
        if (richFields[block.type] !== key) return [{ key, text }]
        return richTextRuns(text).runs.map((run, index) => ({ key: `${key}:${index}`, text: run.data }))
      })
      return { id: block.id, type: block.type, fields, assets: blockAssets(block) }
    }),
  }
}

export function applyCopilotEdits(draft: EmailDocument, proposal: EmailCopilotEdit): EmailDocument {
  const updates = new Map<string, Map<string, string>>()
  const inserts = new Map<string, EmailBlock[]>()
  const blocksById = new Map(draft.blocks.map((block) => [block.id, block]))
  const invalid = () => new Error("No se pudieron preparar los cambios para este borrador.")

  for (const change of proposal.changes) {
    if (change.action === "insert") {
      if (!["start", "end"].includes(change.after) && !blocksById.has(change.after)) throw invalid()
      inserts.set(change.after, [...(inserts.get(change.after) || []), change.block])
    } else {
      if (!blocksById.has(change.blockId)) throw invalid()
      const fields = updates.get(change.blockId) || new Map()
      if (fields.has(change.field)) throw invalid()
      fields.set(change.field, change.value)
      updates.set(change.blockId, fields)
    }
  }

  const edit = (block: EmailBlock): EmailBlock => {
    const changes = updates.get(block.id)
    if (!changes) return block

    const props = { ...block.props } as Record<string, unknown>
    const richField = richFields[block.type]
    const rich = richField ? richTextRuns(String(props[richField] || "")) : null
    let richChanged = false
    for (const [field, value] of changes) {
      const [property, index] = field.split(":")
      if (!editableFields[block.type]?.includes(property)) throw invalid()
      if (property === richField) {
        const run = index && /^\d+$/.test(index) ? rich?.runs[Number(index)] : null
        if (!run) throw invalid()
        run.data = value
        richChanged = true
      } else {
        if (index !== undefined) throw invalid()
        props[property] = value
      }
    }
    if (richChanged && richField && rich) props[richField] = rich.template.innerHTML
    return { ...block, props } as EmailBlock
  }

  return {
    ...draft,
    subject: proposal.subject ?? draft.subject,
    preheader: proposal.preheader ?? draft.preheader,
    blocks: [
      ...(inserts.get("start") || []),
      ...draft.blocks.flatMap((block) => [edit(block), ...(inserts.get(block.id) || [])]),
      ...(inserts.get("end") || []),
    ],
  }
}
