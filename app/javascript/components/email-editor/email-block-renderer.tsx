"use client"

import React from "react"

import type { EmailBlock, EmailDocument, EmailTheme } from "@/lib/email-editor/types"
import { cn } from "@/lib/utils"

interface EmailBlockRendererProps {
  block: EmailBlock
  theme: EmailTheme
  isEditing?: boolean
}

const alignClass = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
}

const imageWidthClass = {
  full: "w-full",
  wide: "w-[85%]",
  medium: "w-[65%]",
  small: "w-[42%]",
}

const radiusClass = {
  none: "rounded-none",
  sm: "rounded-lg",
  md: "rounded-2xl",
  lg: "rounded-[28px]",
}

export function EmailBlockRenderer({
  block,
  theme,
  isEditing = false,
}: EmailBlockRendererProps) {
  switch (block.type) {
    case "heading": {
      const sizeClass = {
        sm: "text-2xl",
        md: "text-3xl",
        lg: "text-4xl",
        xl: "text-5xl",
      }[block.props.size]

      const Tag = block.props.level

      return (
        <div className={cn("flex flex-col gap-2", alignClass[block.props.align])}>
          {block.props.subtitle ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.accentColor }}>
              {block.props.subtitle}
            </p>
          ) : null}
          <Tag className={cn("font-semibold tracking-tight", sizeClass)} style={{ color: block.props.color || theme.headingColor }}>
            {block.props.text}
          </Tag>
        </div>
      )
    }
    case "text":
      return (
        <div
          className={cn(
            "prose max-w-none prose-p:my-0 prose-ul:my-2 prose-ol:my-2",
            block.props.size === "sm" && "prose-sm",
            block.props.size === "lg" && "prose-lg",
            block.props.align === "center" && "prose-p:text-center prose-li:text-left",
            block.props.align === "right" && "prose-p:text-right"
          )}
          style={{ color: block.props.color || theme.textColor }}
          dangerouslySetInnerHTML={{ __html: block.props.content }}
        />
      )
    case "image":
      return block.props.src ? (
        <div className={cn("flex", block.props.align === "left" && "justify-start", block.props.align === "center" && "justify-center", block.props.align === "right" && "justify-end")}>
          <div className={cn("overflow-hidden", imageWidthClass[block.props.width], radiusClass[block.props.borderRadius])}>
            {isEditing || !block.props.href ? (
              <img src={block.props.src} alt={block.props.alt} className="w-full object-cover" />
            ) : (
              <a href={block.props.href} target="_blank" rel="noopener noreferrer">
                <img src={block.props.src} alt={block.props.alt} className="w-full object-cover" />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          Agrega una imagen
        </div>
      )
    case "gallery":
      return (
        <div className={cn("grid gap-4", block.props.columns === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {block.props.images.length > 0 ? block.props.images.map((image) => (
            <div key={image.id} className="space-y-2">
              {image.src ? (
                <img src={image.src} alt={image.alt} className="aspect-square w-full rounded-2xl object-cover" />
              ) : (
                <div className="aspect-square rounded-2xl border border-dashed border-border bg-muted/30" />
              )}
              {block.props.showCaptions && image.caption ? (
                <p className="text-center text-xs text-muted-foreground">{image.caption}</p>
              ) : null}
            </div>
          )) : (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
              Agrega imágenes a la galería
            </div>
          )}
        </div>
      )
    case "links": {
      const validLinks = block.props.links.filter((link) => link.label.trim())

      return (
        <div className={cn("flex flex-col gap-4", alignClass[block.props.align])}>
          {block.props.title ? <p className="text-sm font-semibold" style={{ color: theme.headingColor }}>{block.props.title}</p> : null}
          {block.props.layout === "buttons" ? (
            <div className={cn("flex flex-wrap gap-3", block.props.align === "center" && "justify-center", block.props.align === "right" && "justify-end")}>
              {validLinks.map((link) => (
                <a
                  key={link.id}
                  href={isEditing ? undefined : link.url}
                  onClick={isEditing ? (event) => event.preventDefault() : undefined}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : block.props.layout === "inline" ? (
            <div className="text-sm" style={{ color: theme.textColor }}>
              {validLinks.map((link, index) => (
                <React.Fragment key={link.id}>
                  {index > 0 ? <span className="px-2 text-muted-foreground">•</span> : null}
                  <a
                    href={isEditing ? undefined : link.url}
                    onClick={isEditing ? (event) => event.preventDefault() : undefined}
                    className="font-semibold"
                    style={{ color: theme.accentColor }}
                  >
                    {link.label}
                  </a>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {validLinks.map((link) => (
                <div key={link.id} className="text-sm" style={{ color: theme.textColor }}>
                  •{" "}
                  <a
                    href={isEditing ? undefined : link.url}
                    onClick={isEditing ? (event) => event.preventDefault() : undefined}
                    className="font-semibold"
                    style={{ color: theme.accentColor }}
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    case "bio":
      const bioImageSizeClass = block.props.layout === "compact" ? "h-[96px] w-[96px]" : "h-[180px] w-[180px]"

      return (
        <div
          className={cn(
            "gap-6 rounded-[28px] border border-border/60 p-6",
            block.props.layout === "stacked" ? "flex flex-col items-center text-center" : "grid grid-cols-[180px_1fr] items-center",
            block.props.layout === "compact" && "grid-cols-[110px_1fr]"
          )}
          style={{ backgroundColor: theme.contentBackground }}
        >
          {block.props.image ? (
            <div
              className={cn(
                "shrink-0 overflow-hidden",
                bioImageSizeClass,
                block.props.imageShape === "circle" ? "rounded-full" : "rounded-3xl"
              )}
            >
              <img
                src={block.props.image}
                alt={block.props.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className={cn("shrink-0 bg-muted/40", bioImageSizeClass, block.props.imageShape === "circle" ? "rounded-full" : "rounded-3xl")} />
          )}
          <div className={cn("flex flex-col gap-3", block.props.layout === "stacked" && "items-center text-center")}>
            <div>
              <h3 className="text-2xl font-semibold" style={{ color: theme.headingColor }}>{block.props.name}</h3>
              {block.props.role ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.accentColor }}>{block.props.role}</p> : null}
            </div>
            <p className="text-sm leading-7" style={{ color: theme.textColor }}>{block.props.bio}</p>
            {block.props.ctaText && block.props.ctaUrl ? (
              <a
                href={isEditing ? undefined : block.props.ctaUrl}
                onClick={isEditing ? (event) => event.preventDefault() : undefined}
                className={cn("rounded-full px-4 py-2 text-sm font-semibold text-white", block.props.layout === "stacked" && "self-center")}
                style={{ backgroundColor: theme.accentColor }}
              >
                {block.props.ctaText}
              </a>
            ) : null}
          </div>
        </div>
      )
    case "button":
      return block.props.href || isEditing ? (
        <div className={cn("flex", block.props.align === "left" && "justify-start", block.props.align === "center" && "justify-center", block.props.align === "right" && "justify-end")}>
          <a
            href={isEditing ? undefined : block.props.href}
            onClick={isEditing ? (event) => event.preventDefault() : undefined}
            className={cn(
              "rounded-full px-5 font-semibold",
              block.props.size === "sm" && "py-2 text-sm",
              block.props.size === "md" && "py-3 text-sm",
              block.props.size === "lg" && "py-3.5 text-base"
            )}
            style={
              block.props.variant === "outline"
                ? { color: theme.accentColor, border: `1px solid ${theme.accentColor}` }
                : { color: "#ffffff", backgroundColor: theme.accentColor }
            }
          >
            {block.props.text}
          </a>
        </div>
      ) : null
    case "divider":
      return (
        <div className={cn("flex py-4", block.props.width === "full" && "justify-stretch", block.props.width !== "full" && "justify-center")}>
          <div
            style={{
              width: block.props.width === "full" ? "100%" : block.props.width === "medium" ? "60%" : "35%",
              borderTop: `${block.props.thickness}px solid ${block.props.color || theme.accentColor}`,
            }}
          />
        </div>
      )
    case "spacer":
      return <div style={{ height: `${block.props.height}px` }} />
    case "section":
      return (
        <div
          className={cn(
            "gap-6 rounded-[28px] p-6",
            block.props.layout === "stacked" ? "flex flex-col" : "grid grid-cols-[0.95fr_1.05fr] items-center",
            block.props.layout === "image-right" && "grid-cols-[1.05fr_0.95fr]"
          )}
          style={{ backgroundColor: block.props.backgroundColor || theme.contentBackground }}
        >
          {block.props.layout !== "image-right" && block.props.image ? (
            <img src={block.props.image} alt={block.props.title} className="w-full rounded-3xl object-cover" />
          ) : null}
          <div className="space-y-3">
            {block.props.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.accentColor }}>{block.props.eyebrow}</p> : null}
            <h3 className="text-3xl font-semibold leading-tight" style={{ color: theme.headingColor }}>{block.props.title}</h3>
            <div className="prose max-w-none prose-p:my-0" style={{ color: theme.textColor }} dangerouslySetInnerHTML={{ __html: block.props.body }} />
            {block.props.ctaText && block.props.ctaUrl ? (
              <a
                href={isEditing ? undefined : block.props.ctaUrl}
                onClick={isEditing ? (event) => event.preventDefault() : undefined}
                className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.accentColor }}
              >
                {block.props.ctaText}
              </a>
            ) : null}
          </div>
          {block.props.layout === "image-right" && block.props.image ? (
            <img src={block.props.image} alt={block.props.title} className="w-full rounded-3xl object-cover" />
          ) : null}
        </div>
      )
    default:
      return null
  }
}

export function EmailDocumentFrame({
  document,
  isEditing = false,
}: {
  document: EmailDocument
  isEditing?: boolean
}) {
  const theme = document.theme
  const fontClass = theme.fontFamily === "serif" ? "font-serif" : "font-sans"

  return (
    <div
      className={cn("mx-auto rounded-[32px] p-6 shadow-sm", fontClass)}
      style={{
        backgroundColor: theme.bodyBackground,
        maxWidth: `${theme.contentWidth + 96}px`,
      }}
    >
      <div
        className="mx-auto overflow-hidden rounded-[28px] border border-black/5 p-5"
        style={{
          backgroundColor: theme.contentBackground,
          maxWidth: `${theme.contentWidth}px`,
        }}
      >
        <div className="space-y-5">
          {document.blocks.length > 0 ? (
            document.blocks.map((block) => (
              <EmailBlockRenderer key={block.id} block={block} theme={theme} isEditing={isEditing} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center text-sm text-muted-foreground">
              Agrega bloques para empezar tu correo
            </div>
          )}

          {theme.footerText || theme.unsubscribeUrl ? (
            <div className="border-t border-border/60 pt-5 text-center text-xs text-muted-foreground">
              {theme.footerText ? <p>{theme.footerText}</p> : null}
              {theme.unsubscribeUrl ? (
                <p className="mt-2">
                  <a
                    href={isEditing ? undefined : theme.unsubscribeUrl}
                    onClick={isEditing ? (event) => event.preventDefault() : undefined}
                    style={{ color: theme.accentColor }}
                  >
                    Unsubscribe
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
