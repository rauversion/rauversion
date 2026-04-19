import type {
  EmailBioBlock,
  EmailBlock,
  EmailButtonBlock,
  EmailDividerBlock,
  EmailDocument,
  EmailGalleryBlock,
  EmailHeadingBlock,
  EmailImageBlock,
  EmailLinksBlock,
  EmailSectionBlock,
  EmailSpacerBlock,
  EmailTextBlock,
  EmailTheme,
} from "./types"

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function fontFamilyForTheme(theme: EmailTheme) {
  return theme.fontFamily === "serif"
    ? "Georgia, 'Times New Roman', serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
}

function sectionBackground(theme: EmailTheme, customColor?: string) {
  return customColor?.trim() || theme.contentBackground
}

function sizeToPixels(size: EmailHeadingBlock["props"]["size"]) {
  return {
    sm: 24,
    md: 30,
    lg: 38,
    xl: 46,
  }[size]
}

function textSizeToPixels(size: EmailTextBlock["props"]["size"]) {
  return {
    sm: 14,
    base: 16,
    lg: 18,
  }[size]
}

function imageWidthToPixels(width: EmailImageBlock["props"]["width"], theme: EmailTheme) {
  return {
    full: theme.contentWidth - 48,
    wide: 480,
    medium: 360,
    small: 240,
  }[width]
}

function radiusToPixels(radius: EmailImageBlock["props"]["borderRadius"] | EmailBioBlock["props"]["imageShape"]) {
  if (radius === "circle") return "999px"

  return {
    none: "0px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    rounded: "18px",
  }[radius]
}

function spacingToPixels(spacing: EmailDividerBlock["props"]["spacing"]) {
  return {
    sm: 12,
    md: 24,
    lg: 36,
  }[spacing]
}

function dividerWidth(width: EmailDividerBlock["props"]["width"]) {
  return {
    full: "100%",
    medium: "60%",
    short: "35%",
  }[width]
}

function renderHeading(block: EmailHeadingBlock, theme: EmailTheme) {
  const { text, subtitle, align, color, size } = block.props

  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="12px 24px 4px 24px">
      <mj-column>
        ${subtitle ? `<mj-text align="${align}" font-size="13px" text-transform="uppercase" letter-spacing="1px" color="${escapeAttribute(theme.accentColor)}" padding="0 0 8px 0">${escapeText(subtitle)}</mj-text>` : ""}
        <mj-text align="${align}" font-size="${sizeToPixels(size)}px" font-weight="700" line-height="1.15" color="${escapeAttribute(color?.trim() || theme.headingColor)}" padding="0">${escapeText(text)}</mj-text>
      </mj-column>
    </mj-section>
  `
}

function renderText(block: EmailTextBlock, theme: EmailTheme) {
  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="8px 24px">
      <mj-column>
        <mj-text align="${block.props.align}" font-size="${textSizeToPixels(block.props.size)}px" color="${escapeAttribute(block.props.color?.trim() || theme.textColor)}" line-height="1.7" padding="0">
          ${block.props.content}
        </mj-text>
      </mj-column>
    </mj-section>
  `
}

function renderImage(block: EmailImageBlock, theme: EmailTheme) {
  if (!block.props.src) {
    return ""
  }

  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="12px 24px">
      <mj-column>
        <mj-image src="${escapeAttribute(block.props.src)}" alt="${escapeAttribute(block.props.alt)}" href="${escapeAttribute(block.props.href || "")}" align="${block.props.align}" width="${imageWidthToPixels(block.props.width, theme)}px" border-radius="${radiusToPixels(block.props.borderRadius)}" padding="0" />
      </mj-column>
    </mj-section>
  `
}

function renderGallery(block: EmailGalleryBlock, theme: EmailTheme) {
  if (block.props.images.length === 0) {
    return ""
  }

  const rows = [] as string[]
  const gap = block.props.gap === "lg" ? 20 : block.props.gap === "md" ? 14 : 8

  for (let index = 0; index < block.props.images.length; index += block.props.columns) {
    const rowItems = block.props.images.slice(index, index + block.props.columns)
    rows.push(`
      <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="${index === 0 ? 12 : 0}px 24px 0 24px">
        ${rowItems.map((image) => `
          <mj-column width="${Math.floor(100 / block.props.columns)}%">
            ${image.src ? `<mj-image src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt)}" padding="0 ${gap / 2}px" border-radius="16px" />` : ""}
            ${block.props.showCaptions && image.caption ? `<mj-text align="center" color="${escapeAttribute(theme.textColor)}" font-size="13px" padding="${gap}px ${gap / 2}px 0 ${gap / 2}px">${escapeText(image.caption)}</mj-text>` : ""}
          </mj-column>
        `).join("")}
      </mj-section>
    `)
  }

  return rows.join("")
}

function renderLinks(block: EmailLinksBlock, theme: EmailTheme) {
  const links = block.props.links.filter((item) => item.label.trim() && item.url.trim())
  if (links.length === 0) return ""

  const title = block.props.title?.trim()

  if (block.props.layout === "buttons") {
    return `
      <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="12px 24px">
        <mj-column>
          ${title ? `<mj-text align="${block.props.align}" color="${escapeAttribute(theme.headingColor)}" font-size="16px" font-weight="600" padding="0 0 12px 0">${escapeText(title)}</mj-text>` : ""}
          ${links.map((link) => `
            <mj-button align="${block.props.align}" background-color="${escapeAttribute(theme.accentColor)}" color="#ffffff" href="${escapeAttribute(link.url)}" inner-padding="12px 20px" border-radius="999px" font-size="14px" padding="0 0 10px 0">
              ${escapeText(link.label)}
            </mj-button>
          `).join("")}
        </mj-column>
      </mj-section>
    `
  }

  if (block.props.layout === "inline") {
    const inlineLinks = links
      .map((link) => `<a href="${escapeAttribute(link.url)}" style="color: ${theme.accentColor}; text-decoration: none; font-weight: 600;">${escapeText(link.label)}</a>`)
      .join(" &nbsp;•&nbsp; ")

    return `
      <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="12px 24px">
        <mj-column>
          ${title ? `<mj-text align="${block.props.align}" color="${escapeAttribute(theme.headingColor)}" font-size="16px" font-weight="600" padding="0 0 12px 0">${escapeText(title)}</mj-text>` : ""}
          <mj-text align="${block.props.align}" color="${escapeAttribute(theme.textColor)}" font-size="14px" padding="0">${inlineLinks}</mj-text>
        </mj-column>
      </mj-section>
    `
  }

  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="12px 24px">
      <mj-column>
        ${title ? `<mj-text align="${block.props.align}" color="${escapeAttribute(theme.headingColor)}" font-size="16px" font-weight="600" padding="0 0 12px 0">${escapeText(title)}</mj-text>` : ""}
        <mj-text align="${block.props.align}" color="${escapeAttribute(theme.textColor)}" font-size="14px" line-height="1.8" padding="0">
          ${links.map((link) => `• <a href="${escapeAttribute(link.url)}" style="color: ${theme.accentColor}; text-decoration: none;">${escapeText(link.label)}</a>`).join("<br />")}
        </mj-text>
      </mj-column>
    </mj-section>
  `
}

function renderBio(block: EmailBioBlock, theme: EmailTheme) {
  const imageSize = block.props.layout === "compact" ? 96 : 180
  const imageClasses = block.props.layout === "compact"
    ? "email-bio-avatar email-bio-avatar--compact"
    : "email-bio-avatar"
  const imageMarkup = block.props.image
    ? `<mj-image css-class="${imageClasses}" src="${escapeAttribute(block.props.image)}" alt="${escapeAttribute(block.props.name)}" border-radius="${radiusToPixels(block.props.imageShape)}" padding="0" width="${imageSize}px" />`
    : ""

  const textContent = `
    <mj-text color="${escapeAttribute(theme.headingColor)}" font-size="${block.props.layout === "compact" ? 18 : 22}px" font-weight="700" padding="0">${escapeText(block.props.name)}</mj-text>
    ${block.props.role ? `<mj-text color="${escapeAttribute(theme.accentColor)}" font-size="13px" text-transform="uppercase" letter-spacing="0.5px" padding="6px 0 0 0">${escapeText(block.props.role)}</mj-text>` : ""}
    <mj-text color="${escapeAttribute(theme.textColor)}" font-size="15px" line-height="1.7" padding="12px 0 0 0">${escapeText(block.props.bio)}</mj-text>
    ${block.props.ctaText && block.props.ctaUrl ? `<mj-button align="left" background-color="${escapeAttribute(theme.accentColor)}" color="#ffffff" href="${escapeAttribute(block.props.ctaUrl)}" inner-padding="12px 18px" border-radius="999px" font-size="14px" padding="16px 0 0 0">${escapeText(block.props.ctaText)}</mj-button>` : ""}
  `

  if (block.props.layout === "stacked") {
    return `
      <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="16px 24px">
        <mj-column>
          ${imageMarkup}
          <mj-text align="center" color="${escapeAttribute(theme.headingColor)}" font-size="24px" font-weight="700" padding="18px 0 0 0">${escapeText(block.props.name)}</mj-text>
          ${block.props.role ? `<mj-text align="center" color="${escapeAttribute(theme.accentColor)}" font-size="13px" text-transform="uppercase" letter-spacing="0.5px" padding="6px 0 0 0">${escapeText(block.props.role)}</mj-text>` : ""}
          <mj-text align="center" color="${escapeAttribute(theme.textColor)}" font-size="15px" line-height="1.7" padding="12px 0 0 0">${escapeText(block.props.bio)}</mj-text>
          ${block.props.ctaText && block.props.ctaUrl ? `<mj-button align="center" background-color="${escapeAttribute(theme.accentColor)}" color="#ffffff" href="${escapeAttribute(block.props.ctaUrl)}" inner-padding="12px 18px" border-radius="999px" font-size="14px" padding="16px 0 0 0">${escapeText(block.props.ctaText)}</mj-button>` : ""}
        </mj-column>
      </mj-section>
    `
  }

  if (block.props.layout === "compact") {
    return `
      <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="16px 24px">
        ${imageMarkup ? `<mj-column width="24%">${imageMarkup}</mj-column>` : ""}
        <mj-column width="${imageMarkup ? "76%" : "100%"}">
          ${textContent}
        </mj-column>
      </mj-section>
    `
  }

  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="16px 24px">
      ${imageMarkup ? `<mj-column width="36%">${imageMarkup}</mj-column>` : ""}
      <mj-column width="${imageMarkup ? "64%" : "100%"}">
        ${textContent}
      </mj-column>
    </mj-section>
  `
}

function renderButton(block: EmailButtonBlock, theme: EmailTheme) {
  if (!block.props.href.trim()) return ""

  const isOutline = block.props.variant === "outline"
  const fontSize = block.props.size === "lg" ? 16 : block.props.size === "sm" ? 13 : 14
  const padding = block.props.size === "lg" ? "14px 24px" : block.props.size === "sm" ? "10px 16px" : "12px 20px"

  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="12px 24px">
      <mj-column>
        <mj-button
          align="${block.props.align}"
          href="${escapeAttribute(block.props.href)}"
          background-color="${isOutline ? "transparent" : escapeAttribute(theme.accentColor)}"
          color="${isOutline ? escapeAttribute(theme.accentColor) : "#ffffff"}"
          border="${isOutline ? `1px solid ${theme.accentColor}` : "none"}"
          border-radius="999px"
          font-size="${fontSize}px"
          inner-padding="${padding}"
          padding="0"
        >
          ${escapeText(block.props.text)}
        </mj-button>
      </mj-column>
    </mj-section>
  `
}

function renderDivider(block: EmailDividerBlock, theme: EmailTheme) {
  const spacing = spacingToPixels(block.props.spacing)

  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="${spacing}px 24px">
      <mj-column>
        <mj-divider border-color="${escapeAttribute(block.props.color?.trim() || theme.accentColor)}" border-width="${block.props.thickness}px" width="${dividerWidth(block.props.width)}" padding="0" />
      </mj-column>
    </mj-section>
  `
}

function renderSpacer(block: EmailSpacerBlock, theme: EmailTheme) {
  return `
    <mj-section background-color="${escapeAttribute(sectionBackground(theme))}" padding="0 24px">
      <mj-column>
        <mj-spacer height="${block.props.height}px" />
      </mj-column>
    </mj-section>
  `
}

function renderSection(block: EmailSectionBlock, theme: EmailTheme) {
  const backgroundColor = sectionBackground(theme, block.props.backgroundColor)
  const content = `
    ${block.props.eyebrow ? `<mj-text color="${escapeAttribute(theme.accentColor)}" font-size="13px" text-transform="uppercase" letter-spacing="0.5px" padding="0 0 10px 0">${escapeText(block.props.eyebrow)}</mj-text>` : ""}
    <mj-text color="${escapeAttribute(theme.headingColor)}" font-size="26px" font-weight="700" line-height="1.2" padding="0">${escapeText(block.props.title)}</mj-text>
    <mj-text color="${escapeAttribute(theme.textColor)}" font-size="15px" line-height="1.7" padding="12px 0 0 0">${block.props.body}</mj-text>
    ${block.props.ctaText && block.props.ctaUrl ? `<mj-button align="left" background-color="${escapeAttribute(theme.accentColor)}" color="#ffffff" href="${escapeAttribute(block.props.ctaUrl)}" inner-padding="12px 18px" border-radius="999px" font-size="14px" padding="16px 0 0 0">${escapeText(block.props.ctaText)}</mj-button>` : ""}
  `

  if (block.props.layout === "stacked") {
    return `
      <mj-section background-color="${escapeAttribute(backgroundColor)}" padding="18px 24px">
        <mj-column>
          ${block.props.image ? `<mj-image src="${escapeAttribute(block.props.image)}" padding="0 0 16px 0" border-radius="20px" />` : ""}
          ${content}
        </mj-column>
      </mj-section>
    `
  }

  const imageColumn = block.props.image
    ? `<mj-column width="42%"><mj-image src="${escapeAttribute(block.props.image)}" padding="0" border-radius="20px" /></mj-column>`
    : ""
  const textColumn = `<mj-column width="${block.props.image ? "58%" : "100%"}">${content}</mj-column>`

  return `
    <mj-section background-color="${escapeAttribute(backgroundColor)}" padding="18px 24px">
      ${block.props.layout === "image-right" ? `${textColumn}${imageColumn}` : `${imageColumn}${textColumn}`}
    </mj-section>
  `
}

function renderBlock(block: EmailBlock, theme: EmailTheme) {
  switch (block.type) {
    case "heading":
      return renderHeading(block, theme)
    case "text":
      return renderText(block, theme)
    case "image":
      return renderImage(block, theme)
    case "gallery":
      return renderGallery(block, theme)
    case "links":
      return renderLinks(block, theme)
    case "bio":
      return renderBio(block, theme)
    case "button":
      return renderButton(block, theme)
    case "divider":
      return renderDivider(block, theme)
    case "spacer":
      return renderSpacer(block, theme)
    case "section":
      return renderSection(block, theme)
    default:
      return ""
  }
}

export function serializeEmailDocumentToMjml(document: EmailDocument) {
  const theme = document.theme

  return `
<mjml>
  <mj-head>
    <mj-title>${escapeText(document.subject)}</mj-title>
    ${document.preheader ? `<mj-preview>${escapeText(document.preheader)}</mj-preview>` : ""}
    <mj-style inline="inline">
      .email-bio-avatar table,
      .email-bio-avatar td,
      .email-bio-avatar img {
        width: 180px !important;
        height: 180px !important;
        object-fit: cover !important;
      }

      .email-bio-avatar--compact table,
      .email-bio-avatar--compact td,
      .email-bio-avatar--compact img {
        width: 96px !important;
        height: 96px !important;
      }
    </mj-style>
    <mj-attributes>
      <mj-all font-family="${escapeAttribute(fontFamilyForTheme(theme))}" />
      <mj-text color="${escapeAttribute(theme.textColor)}" font-size="16px" line-height="1.7" />
      <mj-button background-color="${escapeAttribute(theme.accentColor)}" color="#ffffff" border-radius="999px" />
      <mj-section padding="0" />
      <mj-column padding="0" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="${escapeAttribute(theme.bodyBackground)}" width="${theme.contentWidth}px">
    ${document.blocks.map((block) => renderBlock(block, theme)).join("")}
    <mj-section background-color="${escapeAttribute(theme.contentBackground)}" padding="24px 24px 32px 24px">
      <mj-column>
        ${theme.footerText ? `<mj-text align="center" color="${escapeAttribute(theme.textColor)}" font-size="12px" padding="0">${escapeText(theme.footerText)}</mj-text>` : ""}
        ${theme.unsubscribeUrl ? `<mj-text align="center" color="${escapeAttribute(theme.textColor)}" font-size="12px" padding="8px 0 0 0"><a href="${escapeAttribute(theme.unsubscribeUrl)}" style="color: ${theme.accentColor}; text-decoration: none;">Unsubscribe</a></mj-text>` : ""}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
  `.trim()
}
