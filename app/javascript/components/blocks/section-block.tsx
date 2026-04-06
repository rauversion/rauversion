"use client"

import React from "react"

import type { PageStyle, SectionBlock as SectionBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface SectionBlockProps {
  block: SectionBlockType
  pageStyle?: PageStyle
  isEditing?: boolean
}

const titleSizeClasses = {
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl",
} as const

const subtitleSizeClasses = {
  "5xl": "text-5xl",
  "6xl": "text-6xl",
  "7xl": "text-7xl",
  "8xl": "text-8xl",
  "9xl": "text-9xl",
} as const

const textSizeClasses = {
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
} as const

function buildPalette(style?: PageStyle, themeMode: "inherit" | "light" | "dark" = "inherit") {
  const primaryColor = style?.primaryColor || "var(--primary)"
  const template = style?.template || "minimal"
  const darkMode =
    themeMode === "inherit"
      ? style?.darkMode ?? true
      : themeMode === "dark"
  const baseSurface = darkMode ? "#0f0f10" : "#ffffff"
  const baseForeground = darkMode ? "#ffffff" : "#111827"
  const mutedForeground = darkMode ? "rgba(255,255,255,0.72)" : "#4B5563"

  return {
    minimal: {
      surface: `color-mix(in oklab, ${primaryColor} 7%, ${baseSurface})`,
      border: `color-mix(in oklab, ${primaryColor} 34%, transparent)`,
      title: baseForeground,
      subtitle: primaryColor,
      text: mutedForeground,
      overlay: `color-mix(in oklab, ${primaryColor} 18%, ${baseSurface})`,
    },
    bold: {
      surface: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor} 78%, ${darkMode ? "#050505" : "#ffffff"}), color-mix(in oklab, ${primaryColor} 40%, ${darkMode ? "#111111" : "#f5f5f5"}))`,
      border: primaryColor,
      title: "#ffffff",
      subtitle: "rgba(255,255,255,0.82)",
      text: "rgba(255,255,255,0.92)",
      overlay: `linear-gradient(160deg, color-mix(in oklab, ${primaryColor} 74%, ${darkMode ? "#050505" : "#ffffff"}), color-mix(in oklab, ${primaryColor} 45%, ${darkMode ? "#111111" : "#f5f5f5"}))`,
    },
    gradient: {
      surface: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor} 26%, transparent), color-mix(in oklab, ${primaryColor} 10%, ${baseSurface}) 45%, color-mix(in oklab, ${primaryColor} 18%, transparent))`,
      border: `color-mix(in oklab, ${primaryColor} 42%, transparent)`,
      title: baseForeground,
      subtitle: primaryColor,
      text: mutedForeground,
      overlay: `linear-gradient(160deg, color-mix(in oklab, ${primaryColor} 58%, ${darkMode ? "#050505" : "#ffffff"}), color-mix(in oklab, ${primaryColor} 22%, ${baseSurface}))`,
    },
    classic: {
      surface: darkMode
        ? `color-mix(in oklab, ${primaryColor} 10%, #171717)`
        : `color-mix(in oklab, ${primaryColor} 8%, #faf7f0)`,
      border: `color-mix(in oklab, ${primaryColor} 28%, ${darkMode ? "#3f3f46" : "#d6d3d1"})`,
      title: baseForeground,
      subtitle: primaryColor,
      text: mutedForeground,
      overlay: darkMode
        ? `color-mix(in oklab, ${primaryColor} 24%, #171717)`
        : `color-mix(in oklab, ${primaryColor} 18%, #faf7f0)`,
    },
  }[template]
}

export function SectionBlock({ block, pageStyle, isEditing = false }: SectionBlockProps) {
  const {
    variant,
    themeMode = "inherit",
    title,
    subtitle,
    description,
    image,
    titleSize,
    subtitleSize,
    textSize,
  } = block.props

  const titleClass = titleSizeClasses[titleSize]
  const subtitleClass = subtitleSizeClasses[subtitleSize]
  const textClass = textSizeClasses[textSize]
  const palette = buildPalette(pageStyle, themeMode)
  const mobileOverlayHidden = !isEditing
  const isLightMode = themeMode === "light" || (themeMode === "inherit" && pageStyle?.darkMode === false)
  const overlayBase = isLightMode
    ? "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.16) 35%, rgba(255,255,255,0.46) 100%)"
    : "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 35%, rgba(0,0,0,0.64) 100%)"
  const overlayHover = isLightMode
    ? "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.10) 35%, rgba(255,255,255,0.30) 100%)"
    : "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.16) 35%, rgba(0,0,0,0.42) 100%)"

  const renderLeftVariant = () => (
    <div className="grid grid-cols-1 gap-8 rounded-2xl p-6 md:p-8 lg:grid-cols-2" style={{ background: palette.surface }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {image ? (
          <img src={image} alt={title || ""} className="w-full rounded-lg object-cover md:max-w-xs" />
        ) : null}
        <div
          className={cn(textClass, "w-full")}
          style={{ color: palette.text }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>

      <div className="flex flex-col justify-between gap-6">
        <div className="flex justify-start lg:justify-end">
          <p className={cn(subtitleClass, "font-bold")} style={{ color: palette.subtitle }}>
            {subtitle}
          </p>
        </div>
        <p
          className={cn(titleClass, "font-bold uppercase tracking-tight text-left lg:text-right")}
          style={{ color: palette.title }}
        >
          {title}
        </p>
      </div>
    </div>
  )

  const renderRightVariant = () => (
    <div className="grid grid-cols-1 gap-8 rounded-2xl p-6 md:p-8 lg:grid-cols-2" style={{ background: palette.surface }}>
      <div className="flex flex-col gap-4">
        <h2 className={cn(titleClass, "font-bold uppercase")} style={{ color: palette.title }}>
          {title}
        </h2>
        <div
          className={cn(textClass)}
          style={{ color: palette.text }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>

      <div className="flex flex-col justify-end">
        {image ? (
          <img src={image} alt={title || ""} className="mb-4 w-full rounded-lg object-cover" />
        ) : null}
        <p className={cn(subtitleClass, "font-bold text-left lg:text-right")} style={{ color: palette.subtitle }}>
          {subtitle}
        </p>
      </div>
    </div>
  )

  const renderFixedVariant = () => (
    <div className="flex flex-col gap-6 rounded-2xl p-6 md:p-8" style={{ background: palette.surface }}>
      <h2 className={cn(titleClass, "font-bold uppercase")} style={{ color: palette.title }}>
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            className={cn(textClass)}
            style={{ color: palette.text }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        <div className="flex flex-col gap-4">
          {image ? (
            <img src={image} alt={title || ""} className="w-full rounded-lg object-cover" />
          ) : null}
          {subtitle ? (
            <p className={cn("font-bold", subtitleClass)} style={{ color: palette.subtitle }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )

  const renderOverlayVariant = () => (
    <div
      className="group relative grid overflow-hidden rounded-2xl border focus:outline-none"
      style={{ borderColor: palette.border }}
      tabIndex={mobileOverlayHidden ? 0 : -1}
    >
      <div className="col-start-1 row-start-1 min-h-[360px] md:min-h-[420px]">
        {image ? (
          <img
            src={image}
            alt={title || ""}
            className="h-full w-full object-cover transition-all duration-500 md:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            Agrega una imagen para esta seccion
          </div>
        )}
      </div>

      <div
        className={cn(
          "pointer-events-none col-start-1 row-start-1 z-[1] transition-opacity duration-300",
          mobileOverlayHidden
            ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 md:opacity-100"
            : "opacity-100"
        )}
        style={{ background: overlayBase }}
      >
        <div
          className="hidden h-full w-full transition-opacity duration-300 md:block md:opacity-0 md:group-hover:opacity-100"
          style={{ background: overlayHover }}
        />
      </div>

      <div className="col-start-1 row-start-1 z-10 flex justify-stretch md:justify-end">
        <div
          className={cn(
            "relative flex w-full flex-col justify-center p-6 md:w-1/2 md:p-8 lg:w-2/5",
            mobileOverlayHidden
              ? "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 md:opacity-100"
              : "opacity-100"
          )}
          style={{ textShadow: isLightMode ? "0 2px 10px rgba(255,255,255,0.18)" : "0 2px 14px rgba(0,0,0,0.45)" }}
        >
          <div className="relative z-10">
            <h2 className={cn(titleClass, "font-bold leading-none tracking-tight")} style={{ color: palette.title }}>
              {title}
            </h2>
            <p
              className={cn(subtitleClass, "pt-3 font-bold uppercase tracking-tight text-left md:text-right")}
              style={{ color: palette.subtitle }}
            >
              {subtitle}
            </p>
            <div
              className={cn("mt-4", textClass)}
              style={{ color: palette.text }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const content = {
    left: renderLeftVariant,
    right: renderRightVariant,
    fixed: renderFixedVariant,
    overlay: renderOverlayVariant,
  }[variant]()

  return (
    <section
      className={cn(
        "border-t-4 px-4 py-10",
        variant === "overlay" ? "" : "mx-auto max-w-6xl"
      )}
      style={{
        borderColor: palette.border,
      }}
    >
      {content}
    </section>
  )
}
