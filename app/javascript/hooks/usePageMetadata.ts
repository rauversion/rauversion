import { useEffect } from "react"

export interface PageMetadata {
  title: string
  document_title: string
  description: string
  image: string
  url: string
  type: string
}

// Keep client-side navigation in sync with the metadata rendered by Rails.
export function usePageMetadata(metadata: PageMetadata | null) {
  useEffect(() => {
    if (!metadata) return

    const previousTitle = document.title
    document.title = metadata.document_title

    const tags = [
      ["meta", "name", "description", metadata.description],
      ["meta", "name", "image", metadata.image],
      ["meta", "property", "og:title", metadata.title],
      ["meta", "property", "og:description", metadata.description],
      ["meta", "property", "og:image", metadata.image],
      ["meta", "property", "og:url", metadata.url],
      ["meta", "property", "og:type", metadata.type],
      ["meta", "property", "og:site_name", "Rauversion"],
      ["meta", "name", "twitter:card", "summary_large_image"],
      ["meta", "name", "twitter:site", "@rauversion"],
      ["meta", "name", "twitter:title", metadata.title],
      ["meta", "name", "twitter:description", metadata.description],
      ["meta", "name", "twitter:image", metadata.image],
      ["link", "rel", "canonical", metadata.url],
    ]

    const restoreTags = tags.map(([tag, key, name, value]) => {
      const selector = `${tag}[${key}="${name}"]`
      const existing = document.head.querySelector(selector)
      const element = existing || document.createElement(tag)
      const attribute = tag === "link" ? "href" : "content"
      const previousValue = element.getAttribute(attribute)

      element.setAttribute(key, name)
      element.setAttribute(attribute, value)
      if (!existing) document.head.appendChild(element)

      return () => {
        if (!existing) element.remove()
        else if (previousValue === null) element.removeAttribute(attribute)
        else element.setAttribute(attribute, previousValue)
      }
    })

    return () => {
      document.title = previousTitle
      restoreTags.forEach((restore) => restore())
    }
  }, [metadata])
}
