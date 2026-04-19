export type EmailBlockType =
  | "heading"
  | "text"
  | "image"
  | "gallery"
  | "links"
  | "bio"
  | "button"
  | "divider"
  | "spacer"
  | "section"

export type EmailAlign = "left" | "center" | "right"
export type EmailFontFamily = "sans" | "serif"
export type EmailTextSize = "sm" | "base" | "lg"
export type EmailHeadingSize = "sm" | "md" | "lg" | "xl"
export type EmailImageWidth = "full" | "wide" | "medium" | "small"
export type EmailRadius = "none" | "sm" | "md" | "lg"

export interface EmailTheme {
  bodyBackground: string
  contentBackground: string
  contentWidth: 600 | 640
  fontFamily: EmailFontFamily
  textColor: string
  headingColor: string
  accentColor: string
  footerText: string
  unsubscribeUrl: string
}

export interface EmailBaseBlock {
  id: string
  type: EmailBlockType
}

export interface EmailHeadingBlock extends EmailBaseBlock {
  type: "heading"
  props: {
    text: string
    subtitle?: string
    level: "h1" | "h2" | "h3"
    align: EmailAlign
    size: EmailHeadingSize
    color?: string
  }
}

export interface EmailTextBlock extends EmailBaseBlock {
  type: "text"
  props: {
    content: string
    align: EmailAlign
    size: EmailTextSize
    color?: string
  }
}

export interface EmailImageBlock extends EmailBaseBlock {
  type: "image"
  props: {
    src: string
    alt: string
    href?: string
    align: EmailAlign
    width: EmailImageWidth
    borderRadius: EmailRadius
  }
}

export interface EmailGalleryImage {
  id: string
  src: string
  alt: string
  caption?: string
}

export interface EmailGalleryBlock extends EmailBaseBlock {
  type: "gallery"
  props: {
    images: EmailGalleryImage[]
    columns: 2 | 3
    gap: "sm" | "md" | "lg"
    showCaptions: boolean
  }
}

export interface EmailLinkItem {
  id: string
  label: string
  url: string
}

export interface EmailLinksBlock extends EmailBaseBlock {
  type: "links"
  props: {
    title?: string
    layout: "buttons" | "inline" | "list"
    align: EmailAlign
    links: EmailLinkItem[]
  }
}

export interface EmailBioBlock extends EmailBaseBlock {
  type: "bio"
  props: {
    layout: "stacked" | "split" | "compact"
    name: string
    role?: string
    bio: string
    image?: string
    imageShape: "circle" | "rounded"
    ctaText?: string
    ctaUrl?: string
  }
}

export interface EmailButtonBlock extends EmailBaseBlock {
  type: "button"
  props: {
    text: string
    href: string
    align: EmailAlign
    variant: "solid" | "outline"
    size: "sm" | "md" | "lg"
  }
}

export interface EmailDividerBlock extends EmailBaseBlock {
  type: "divider"
  props: {
    color?: string
    thickness: 1 | 2 | 3
    width: "full" | "medium" | "short"
    spacing: "sm" | "md" | "lg"
  }
}

export interface EmailSpacerBlock extends EmailBaseBlock {
  type: "spacer"
  props: {
    height: 16 | 24 | 32 | 48 | 64
  }
}

export interface EmailSectionBlock extends EmailBaseBlock {
  type: "section"
  props: {
    layout: "image-left" | "image-right" | "stacked"
    eyebrow?: string
    title: string
    body: string
    image?: string
    ctaText?: string
    ctaUrl?: string
    backgroundColor?: string
  }
}

export type EmailBlock =
  | EmailHeadingBlock
  | EmailTextBlock
  | EmailImageBlock
  | EmailGalleryBlock
  | EmailLinksBlock
  | EmailBioBlock
  | EmailButtonBlock
  | EmailDividerBlock
  | EmailSpacerBlock
  | EmailSectionBlock

export interface EmailDocument {
  id: string
  name: string
  subject: string
  preheader: string
  theme: EmailTheme
  blocks: EmailBlock[]
  schemaVersion: 1
  createdAt: number
  updatedAt: number
}
