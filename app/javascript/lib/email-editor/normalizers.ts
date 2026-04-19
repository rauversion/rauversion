import { createDefaultEmailBlock, createNewEmailDocument, defaultEmailTheme } from "./defaults"
import type {
  EmailAlign,
  EmailBlock,
  EmailBlockType,
  EmailDocument,
  EmailFontFamily,
  EmailHeadingBlock,
  EmailHeadingSize,
  EmailImageWidth,
  EmailLinkItem,
  EmailRadius,
  EmailTextSize,
  EmailTheme,
} from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function stringOr(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function booleanOr(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function isEmailBlockType(value: unknown): value is EmailBlockType {
  return [
    "heading",
    "text",
    "image",
    "gallery",
    "links",
    "bio",
    "button",
    "divider",
    "spacer",
    "section",
  ].includes(String(value))
}

function alignOr(value: unknown, fallback: EmailAlign): EmailAlign {
  return value === "center" || value === "right" || value === "left" ? value : fallback
}

function fontFamilyOr(value: unknown, fallback: EmailFontFamily): EmailFontFamily {
  return value === "serif" || value === "sans" ? value : fallback
}

function textSizeOr(value: unknown, fallback: EmailTextSize): EmailTextSize {
  return value === "sm" || value === "lg" || value === "base" ? value : fallback
}

function headingSizeOr(value: unknown, fallback: EmailHeadingSize): EmailHeadingSize {
  return value === "sm" || value === "md" || value === "lg" || value === "xl" ? value : fallback
}

function imageWidthOr(value: unknown, fallback: EmailImageWidth): EmailImageWidth {
  return value === "full" || value === "wide" || value === "medium" || value === "small" ? value : fallback
}

function radiusOr(value: unknown, fallback: EmailRadius): EmailRadius {
  return value === "none" || value === "sm" || value === "md" || value === "lg" ? value : fallback
}

function normalizeTheme(value: unknown): EmailTheme {
  if (!isRecord(value)) {
    return { ...defaultEmailTheme }
  }

  return {
    bodyBackground: stringOr(value.bodyBackground, defaultEmailTheme.bodyBackground),
    contentBackground: stringOr(value.contentBackground, defaultEmailTheme.contentBackground),
    contentWidth: value.contentWidth === 640 ? 640 : 600,
    fontFamily: fontFamilyOr(value.fontFamily, defaultEmailTheme.fontFamily),
    textColor: stringOr(value.textColor, defaultEmailTheme.textColor),
    headingColor: stringOr(value.headingColor, defaultEmailTheme.headingColor),
    accentColor: stringOr(value.accentColor, defaultEmailTheme.accentColor),
    footerText: stringOr(value.footerText, defaultEmailTheme.footerText),
    unsubscribeUrl: stringOr(value.unsubscribeUrl, defaultEmailTheme.unsubscribeUrl),
  }
}

function normalizeHeadingBlock(value: Record<string, unknown>): EmailHeadingBlock {
  const base = createDefaultEmailBlock("heading")
  if (base.type !== "heading") {
    throw new Error("Invalid default heading block")
  }

  const props = isRecord(value.props) ? value.props : {}

  return {
    id: stringOr(value.id, base.id),
    type: "heading",
    props: {
      text: stringOr(props.text, base.props.text),
      subtitle: optionalString(props.subtitle) ?? base.props.subtitle,
      level: props.level === "h2" || props.level === "h3" || props.level === "h1" ? props.level : base.props.level,
      align: alignOr(props.align, base.props.align),
      size: headingSizeOr(props.size, base.props.size),
      color: optionalString(props.color),
    },
  }
}

function normalizeLinkItem(value: unknown): EmailLinkItem | null {
  if (!isRecord(value)) return null

  return {
    id: stringOr(value.id, `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    label: stringOr(value.label),
    url: stringOr(value.url),
  }
}

export function normalizeEmailBlock(value: unknown): EmailBlock | null {
  if (!isRecord(value) || !isEmailBlockType(value.type)) return null

  const props = isRecord(value.props) ? value.props : {}

  switch (value.type) {
    case "heading":
      return normalizeHeadingBlock(value)
    case "text": {
      const base = createDefaultEmailBlock("text")
      if (base.type !== "text") return null

      return {
        id: stringOr(value.id, base.id),
        type: "text",
        props: {
          content: stringOr(props.content, base.props.content),
          align: alignOr(props.align, base.props.align),
          size: textSizeOr(props.size, base.props.size),
          color: optionalString(props.color),
        },
      }
    }
    case "image": {
      const base = createDefaultEmailBlock("image")
      if (base.type !== "image") return null

      return {
        id: stringOr(value.id, base.id),
        type: "image",
        props: {
          src: stringOr(props.src, base.props.src),
          alt: stringOr(props.alt, base.props.alt),
          href: optionalString(props.href) ?? base.props.href,
          align: alignOr(props.align, base.props.align),
          width: imageWidthOr(props.width, base.props.width),
          borderRadius: radiusOr(props.borderRadius, base.props.borderRadius),
        },
      }
    }
    case "gallery": {
      const base = createDefaultEmailBlock("gallery")
      if (base.type !== "gallery") return null

      return {
        id: stringOr(value.id, base.id),
        type: "gallery",
        props: {
          images: Array.isArray(props.images)
            ? props.images
              .map((image) => {
                if (!isRecord(image)) return null

                return {
                  id: stringOr(image.id, `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
                  src: stringOr(image.src),
                  alt: stringOr(image.alt),
                  caption: optionalString(image.caption),
                }
              })
              .filter((image): image is NonNullable<typeof image> => Boolean(image))
            : base.props.images,
          columns: props.columns === 3 ? 3 : 2,
          gap: props.gap === "sm" || props.gap === "lg" || props.gap === "md" ? props.gap : base.props.gap,
          showCaptions: booleanOr(props.showCaptions, base.props.showCaptions),
        },
      }
    }
    case "links": {
      const base = createDefaultEmailBlock("links")
      if (base.type !== "links") return null

      return {
        id: stringOr(value.id, base.id),
        type: "links",
        props: {
          title: optionalString(props.title) ?? base.props.title,
          layout: props.layout === "inline" || props.layout === "list" || props.layout === "buttons" ? props.layout : base.props.layout,
          align: alignOr(props.align, base.props.align),
          links: Array.isArray(props.links)
            ? props.links
              .map(normalizeLinkItem)
              .filter((item): item is EmailLinkItem => Boolean(item))
            : base.props.links,
        },
      }
    }
    case "bio": {
      const base = createDefaultEmailBlock("bio")
      if (base.type !== "bio") return null

      return {
        id: stringOr(value.id, base.id),
        type: "bio",
        props: {
          layout: props.layout === "stacked" || props.layout === "compact" || props.layout === "split" ? props.layout : base.props.layout,
          name: stringOr(props.name, base.props.name),
          role: optionalString(props.role),
          bio: stringOr(props.bio, base.props.bio),
          image: optionalString(props.image),
          imageShape: props.imageShape === "circle" || props.imageShape === "rounded" ? props.imageShape : base.props.imageShape,
          ctaText: optionalString(props.ctaText),
          ctaUrl: optionalString(props.ctaUrl),
        },
      }
    }
    case "button": {
      const base = createDefaultEmailBlock("button")
      if (base.type !== "button") return null

      return {
        id: stringOr(value.id, base.id),
        type: "button",
        props: {
          text: stringOr(props.text, base.props.text),
          href: stringOr(props.href, base.props.href),
          align: alignOr(props.align, base.props.align),
          variant: props.variant === "outline" || props.variant === "solid" ? props.variant : base.props.variant,
          size: props.size === "sm" || props.size === "lg" || props.size === "md" ? props.size : base.props.size,
        },
      }
    }
    case "divider": {
      const base = createDefaultEmailBlock("divider")
      if (base.type !== "divider") return null

      return {
        id: stringOr(value.id, base.id),
        type: "divider",
        props: {
          color: optionalString(props.color),
          thickness: props.thickness === 2 || props.thickness === 3 ? props.thickness : 1,
          width: props.width === "medium" || props.width === "short" || props.width === "full" ? props.width : base.props.width,
          spacing: props.spacing === "sm" || props.spacing === "lg" || props.spacing === "md" ? props.spacing : base.props.spacing,
        },
      }
    }
    case "spacer": {
      const base = createDefaultEmailBlock("spacer")
      if (base.type !== "spacer") return null

      return {
        id: stringOr(value.id, base.id),
        type: "spacer",
        props: {
          height: [16, 24, 32, 48, 64].includes(Number(props.height))
            ? Number(props.height) as 16 | 24 | 32 | 48 | 64
            : base.props.height,
        },
      }
    }
    case "section": {
      const base = createDefaultEmailBlock("section")
      if (base.type !== "section") return null

      return {
        id: stringOr(value.id, base.id),
        type: "section",
        props: {
          layout: props.layout === "image-right" || props.layout === "stacked" || props.layout === "image-left" ? props.layout : base.props.layout,
          eyebrow: optionalString(props.eyebrow),
          title: stringOr(props.title, base.props.title),
          body: stringOr(props.body, base.props.body),
          image: optionalString(props.image),
          ctaText: optionalString(props.ctaText),
          ctaUrl: optionalString(props.ctaUrl),
          backgroundColor: optionalString(props.backgroundColor),
        },
      }
    }
    default:
      return null
  }
}

export function normalizeEmailDocument(value: unknown, fallbackName = "Nuevo correo"): EmailDocument {
  const base = createNewEmailDocument(fallbackName)

  if (!isRecord(value)) {
    return base
  }

  const blocks = Array.isArray(value.blocks)
    ? value.blocks
      .map(normalizeEmailBlock)
      .filter((block): block is EmailBlock => Boolean(block))
    : base.blocks

  return {
    id: stringOr(value.id, base.id),
    name: stringOr(value.name, base.name),
    subject: stringOr(value.subject, base.subject),
    preheader: stringOr(value.preheader, base.preheader),
    theme: normalizeTheme(value.theme),
    blocks,
    schemaVersion: 1,
    createdAt: numberOr(value.createdAt, base.createdAt),
    updatedAt: numberOr(value.updatedAt, base.updatedAt),
  }
}
