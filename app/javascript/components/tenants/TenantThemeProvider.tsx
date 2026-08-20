import React from "react"

export type TenantThemeSchema = {
  $schema?: string
  name?: string
  type: "registry:theme"
  cssVars: {
    theme?: Record<string, string>
    light?: Record<string, string>
    dark?: Record<string, string>
  }
}

function currentColorMode() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function themeStyle(theme: TenantThemeSchema | null | undefined, mode: "light" | "dark") {
  if (!theme?.cssVars) return {}

  const variables = {
    ...(theme.cssVars.theme || {}),
    ...(theme.cssVars[mode] || theme.cssVars.light || {}),
  }

  return Object.fromEntries(
    Object.entries(variables).map(([token, value]) => [`--${token}`, value])
  )
}

export default function TenantThemeProvider({
  theme,
  children,
}: {
  theme?: TenantThemeSchema | null
  children: React.ReactNode
}) {
  const [activeTheme, setActiveTheme] = React.useState(theme)
  const [mode, setMode] = React.useState<"light" | "dark">(() => currentColorMode())

  React.useEffect(() => setActiveTheme(theme), [theme])

  React.useEffect(() => {
    const updateTheme = (event: Event) => {
      setActiveTheme((event as CustomEvent<TenantThemeSchema>).detail)
    }
    window.addEventListener("tenant-theme:change", updateTheme)
    return () => window.removeEventListener("tenant-theme:change", updateTheme)
  }, [])

  React.useEffect(() => {
    const observer = new MutationObserver(() => setMode(currentColorMode()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  React.useLayoutEffect(() => {
    if (!activeTheme?.cssVars) return undefined

    const variables = themeStyle(activeTheme, mode)
    const targets = [document.documentElement, document.body]
    const previousBodyDark = document.body.classList.contains("dark")
    const previousValues = targets.map((target) =>
      Object.keys(variables).map((property) => ({
        property,
        value: target.style.getPropertyValue(property),
        priority: target.style.getPropertyPriority(property),
      }))
    )

    document.documentElement.dataset.tenantTheme = activeTheme.name || "custom"
    document.body.classList.toggle("dark", mode === "dark")
    targets.forEach((target) => {
      Object.entries(variables).forEach(([property, value]) => target.style.setProperty(property, value))
    })

    return () => {
      delete document.documentElement.dataset.tenantTheme
      document.body.classList.toggle("dark", previousBodyDark)
      targets.forEach((target, targetIndex) => {
        previousValues[targetIndex].forEach(({ property, value, priority }) => {
          if (value) target.style.setProperty(property, value, priority)
          else target.style.removeProperty(property)
        })
      })
    }
  }, [activeTheme, mode])

  return <>{children}</>
}
