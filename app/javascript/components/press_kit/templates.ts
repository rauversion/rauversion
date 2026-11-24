import type { CSSProperties } from "react"

export const PRESS_KIT_TEMPLATES = ["classic", "editorial", "poster"] as const
export type PressKitTemplate = typeof PRESS_KIT_TEMPLATES[number]
export interface PressKitDesign {
  template?: PressKitTemplate
  theme?: "light" | "dark"
  heroPhotoId?: number | string
}

export function resolveTemplate(value?: string): PressKitTemplate {
  return PRESS_KIT_TEMPLATES.includes(value as PressKitTemplate) ? value as PressKitTemplate : "classic"
}

export function defaultTemplateTheme(template: PressKitTemplate): "light" | "dark" {
  return template === "editorial" ? "light" : "dark"
}

// Scope the palette to the kit so a template never changes the rest of the site.
export function templateStyle(template: PressKitTemplate, dark: boolean): CSSProperties {
  const editorial = template === "editorial"
  const poster = template === "poster"
  const background = dark ? (editorial ? "#191815" : "#0c0d10") : (editorial ? "#f6f2e9" : "#fafafa")
  const foreground = dark ? "#f6f3ec" : "#1b1b1b"
  const surface = dark ? (editorial ? "#23211d" : "#17181d") : (editorial ? "#eee8db" : "#eeeeef")
  const accent = poster ? (dark ? "#d7ff57" : "#4b6500") : editorial ? (dark ? "#e1b69a" : "#8d3b24") : (dark ? "#aa91ff" : "#6942cc")

  return {
    colorScheme: dark ? "dark" : "light",
    "--background": background,
    "--foreground": foreground,
    "--card": background,
    "--card-foreground": foreground,
    "--popover": background,
    "--popover-foreground": foreground,
    "--secondary": surface,
    "--secondary-foreground": foreground,
    "--muted": surface,
    "--muted-foreground": dark ? "#aaa7a0" : "#66635e",
    "--accent": surface,
    "--accent-foreground": foreground,
    "--primary": accent,
    "--primary-foreground": dark ? (poster ? "#172000" : editorial ? "#25190f" : "#181126") : "#ffffff",
    "--border": dark ? "#383733" : "#d5d1c9",
    "--input": dark ? "#383733" : "#d5d1c9",
    "--ring": accent,
  } as CSSProperties
}

export const templateLayout = {
  classic: {
    main: "max-w-6xl mx-auto px-6 sm:px-8 lg:px-16",
    hero: "min-h-screen flex items-center py-20",
    title: "text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-balance",
  },
  editorial: {
    main: "max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 [&>section]:min-h-0 [&>section]:py-16 [&_section_h2]:font-serif [&_section_h2]:font-normal",
    hero: "min-h-[80vh] grid items-center gap-12 py-16 sm:py-24",
    title: "font-serif text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.95] break-words",
  },
  poster: {
    main: "max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 [&>section]:min-h-0 [&>section]:py-20 [&_section_h2]:uppercase [&_section_h2]:tracking-tighter",
    hero: "relative isolate my-6 flex min-h-[80vh] items-end overflow-hidden rounded-2xl border border-border p-6 sm:my-10 sm:p-12 lg:p-16",
    title: "text-6xl sm:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.9] break-words",
  },
}
