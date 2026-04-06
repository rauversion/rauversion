import type { PageStyle, TemplateStyle } from "@/lib/blocks/types"

export type PlaylistThemeMode = "dark" | "light"

export function resolvePlaylistTheme(
  pageStyle?: Pick<PageStyle, "darkMode">,
  themeMode: PlaylistThemeMode | "auto" | "inherit" = "auto"
): PlaylistThemeMode {
  if (themeMode === "light") return "light"
  if (themeMode === "dark") return "dark"

  return pageStyle?.darkMode === false ? "light" : "dark"
}

export function buildPlaylistPalette({
  primaryColor = "var(--primary)",
  template = "minimal",
  themeMode = "dark",
}: {
  primaryColor?: string
  template?: TemplateStyle
  themeMode?: PlaylistThemeMode
}) {
  const darkMode = themeMode !== "light"
  const baseSurface = darkMode ? "#0f0f10" : "#ffffff"
  const baseForeground = darkMode ? "#ffffff" : "#111827"
  const mutedForeground = darkMode ? "rgba(255,255,255,0.68)" : "#6B7280"

  return {
    minimal: {
      surface: `color-mix(in oklab, ${primaryColor} 7%, ${baseSurface})`,
      panel: `color-mix(in oklab, ${primaryColor} 4%, ${darkMode ? "#151518" : "#f8fafc"})`,
      border: `color-mix(in oklab, ${primaryColor} 28%, transparent)`,
      text: baseForeground,
      muted: mutedForeground,
      accent: primaryColor,
      accentSoft: `color-mix(in oklab, ${primaryColor} 16%, transparent)`,
    },
    bold: {
      surface: `linear-gradient(160deg, color-mix(in oklab, ${primaryColor} 70%, ${darkMode ? "#050505" : "#ffffff"}), color-mix(in oklab, ${primaryColor} 30%, ${darkMode ? "#131313" : "#f5f5f5"}))`,
      panel: `color-mix(in oklab, ${primaryColor} 18%, ${darkMode ? "#0c0c0f" : "#ffffff"})`,
      border: primaryColor,
      text: "#ffffff",
      muted: "rgba(255,255,255,0.78)",
      accent: primaryColor,
      accentSoft: `color-mix(in oklab, ${primaryColor} 22%, transparent)`,
    },
    gradient: {
      surface: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor} 24%, transparent), color-mix(in oklab, ${primaryColor} 8%, ${baseSurface}) 45%, color-mix(in oklab, ${primaryColor} 16%, transparent))`,
      panel: `color-mix(in oklab, ${primaryColor} 10%, ${darkMode ? "#141418" : "#f8fafc"})`,
      border: `color-mix(in oklab, ${primaryColor} 36%, transparent)`,
      text: baseForeground,
      muted: mutedForeground,
      accent: primaryColor,
      accentSoft: `color-mix(in oklab, ${primaryColor} 20%, transparent)`,
    },
    classic: {
      surface: darkMode
        ? `color-mix(in oklab, ${primaryColor} 10%, #171717)`
        : `color-mix(in oklab, ${primaryColor} 8%, #faf7f0)`,
      panel: darkMode
        ? `color-mix(in oklab, ${primaryColor} 6%, #101011)`
        : `color-mix(in oklab, ${primaryColor} 5%, #f5f1e8)`,
      border: `color-mix(in oklab, ${primaryColor} 24%, ${darkMode ? "#3f3f46" : "#d6d3d1"})`,
      text: baseForeground,
      muted: mutedForeground,
      accent: primaryColor,
      accentSoft: `color-mix(in oklab, ${primaryColor} 16%, transparent)`,
    },
  }[template]
}

export function resolvePlaylistCoverUrl(
  coverUrl:
    | string
    | {
        small?: string
        medium?: string
        large?: string
        cropped_image?: string
      }
    | null
    | undefined
) {
  if (!coverUrl) return null
  if (typeof coverUrl === "string") return coverUrl

  return coverUrl.medium || coverUrl.large || coverUrl.small || coverUrl.cropped_image || null
}
