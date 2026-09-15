import React from "react"
import I18n from "@/stores/locales"
import { get, patch } from "@rails/request.js"
import {
  ArrowLeft,
  ArrowUpRight,
  Braces,
  Check,
  ChevronDown,
  CircleAlert,
  Image as ImageIcon,
  Loader2,
  Palette,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react"
import { useParams } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import amplifierThemeJson from "@/themes/tenant/amplifier.json"
import editorialThemeJson from "@/themes/tenant/editorial.json"
import waveformThemeJson from "@/themes/tenant/waveform.json"
import broadcastThemeJson from "@/themes/tenant/broadcast.json"

type TemplateKey = "amplifier" | "editorial" | "waveform" | "broadcast"
type HeadingFont = "space_grotesk" | "archivo_clash" | "ibm_plex"

type ThemeSchema = {
  $schema?: string
  name: string
  title?: string
  description?: string
  type: "registry:theme"
  cssVars: {
    theme?: Record<string, string>
    light: Record<string, string>
    dark: Record<string, string>
  }
}

type Branding = {
  tagline: string
  template: TemplateKey
  primary_color: string
  accent_color: string
  background_color: string
  heading_font: HeadingFont
  theme_schema: ThemeSchema
}

type Tenant = {
  id: number
  name: string
  slug: string
  role: string
  preview_url: string
  can_manage_settings: boolean
  logo_url: string | null
  settings: Branding
}

const templates: Array<{ key: TemplateKey; name: string; description: string }> = [
  { key: "amplifier", name: I18n.t("tenants.settings.templates.amplifier.name"), description: I18n.t("tenants.settings.templates.amplifier.description") },
  { key: "editorial", name: I18n.t("tenants.settings.templates.editorial.name"), description: I18n.t("tenants.settings.templates.editorial.description") },
  { key: "waveform", name: I18n.t("tenants.settings.templates.waveform.name"), description: I18n.t("tenants.settings.templates.waveform.description") },
  { key: "broadcast", name: I18n.t("tenants.settings.templates.broadcast.name"), description: I18n.t("tenants.settings.templates.broadcast.description") },
]

const themePresets: Record<TemplateKey, ThemeSchema> = {
  amplifier: amplifierThemeJson as ThemeSchema,
  editorial: editorialThemeJson as ThemeSchema,
  waveform: waveformThemeJson as ThemeSchema,
  broadcast: broadcastThemeJson as ThemeSchema,
}

const cloneThemePreset = (template: TemplateKey) => JSON.parse(JSON.stringify(themePresets[template])) as ThemeSchema

const fontLabels: Record<HeadingFont, string> = {
  space_grotesk: "Space Grotesk",
  archivo_clash: "Archivo / Clash",
  ibm_plex: "IBM Plex",
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer p-1"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 font-mono uppercase" maxLength={7} />
      </div>
    </div>
  )
}

function BrandPreview({ tenant, branding, logoPreview }: { tenant: Tenant; branding: Branding; logoPreview: string | null }) {
  const theme = branding.theme_schema?.cssVars?.light || {}
  const previewBackground = theme.background || branding.background_color
  const previewForeground = theme.foreground || "#ffffff"
  const previewPrimary = theme.primary || branding.primary_color
  const previewAccent = theme.accent || branding.accent_color
  const templateClass = {
    amplifier: "rounded-[2rem]",
    editorial: "rounded-none",
    waveform: "rounded-xl",
    broadcast: "rounded-none border-2",
  }[branding.template]

  return (
    <div
      className={cn("relative isolate min-h-[31rem] overflow-hidden border border-border p-7 shadow-2xl", templateClass)}
      style={{ backgroundColor: previewBackground, color: previewForeground }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: previewPrimary }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {logoPreview ? (
            <img src={logoPreview} alt={I18n.t("tenants.settings.logo")} className="h-11 w-11 rounded-xl object-contain" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-xl font-bold" style={{ backgroundColor: previewPrimary, color: theme["primary-foreground"] || "#000000" }}>
              {tenant.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-semibold" style={{ color: previewForeground }}>{tenant.name}</span>
        </div>
        <div className="flex gap-4 text-[10px] uppercase tracking-[0.18em] opacity-50" style={{ color: previewForeground }}>
          <span>{I18n.t("tenants.settings.preview.music")}</span><span>{I18n.t("tenants.settings.preview.events")}</span><span>{I18n.t("tenants.settings.preview.store")}</span>
        </div>
      </div>

      <div className={cn("relative mt-24", branding.template === "editorial" && "mt-16 border-l pl-6", branding.template === "broadcast" && "mt-14 border-t-2 pt-5")} style={{ borderColor: previewAccent }}>
        <Badge className="border-0" style={{ backgroundColor: previewAccent, color: theme["accent-foreground"] || "#000000" }}>{I18n.t("tenants.settings.preview.season")}</Badge>
        <h2 className="mt-5 max-w-md text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl" style={{ color: previewForeground }}>
          {branding.tagline || I18n.t("tenants.settings.preview.fallback_tagline")}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed opacity-55" style={{ color: previewForeground }}>
          {I18n.t("tenants.settings.preview.description")}
        </p>
        <Button className={cn("mt-7 border-0", branding.template === "broadcast" && "rounded-none font-black uppercase tracking-wider")} style={{ backgroundColor: previewPrimary, color: theme["primary-foreground"] || "#000000" }}>{I18n.t("tenants.settings.preview.explore")}</Button>
      </div>

      <div className="absolute inset-x-7 bottom-7 grid grid-cols-3 gap-2">
        {[I18n.t("tenants.settings.preview.latest_release"), I18n.t("tenants.settings.preview.next_event"), I18n.t("tenants.settings.preview.selection")].map((label, index) => (
          <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="mb-3 h-1 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${82 - index * 18}%`, backgroundColor: index === 1 ? previewAccent : previewPrimary }} /></div>
            <p className="text-[10px] opacity-45" style={{ color: previewForeground }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TenantSettings() {
  const { id = "" } = useParams()
  const [tenant, setTenant] = React.useState<Tenant | null>(null)
  const [branding, setBranding] = React.useState<Branding | null>(null)
  const [name, setName] = React.useState("")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [templateSaving, setTemplateSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const [themeDraft, setThemeDraft] = React.useState("")
  const [themeError, setThemeError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    get(`/tenants/${id}.json`)
      .then(async (response) => {
        const body = await response.json
        if (!response.ok) throw new Error("load_failed")
        if (!active) return
        setTenant(body.tenant)
        setBranding(body.tenant.settings)
        setName(body.tenant.name)
        setLogoPreview(body.tenant.logo_url)
        setThemeDraft(JSON.stringify(body.tenant.settings.theme_schema, null, 2))
      })
      .catch(() => active && setError(I18n.t("tenants.settings.load_error")))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id])

  React.useEffect(() => {
    if (!logoFile) return
    const objectUrl = URL.createObjectURL(logoFile)
    setLogoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [logoFile])

  const updateBranding = <Key extends keyof Branding>(key: Key, value: Branding[Key]) => {
    setBranding((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
  }

  const applyTheme = (theme: ThemeSchema) => {
    const light = theme.cssVars.light || {}
    setBranding((current) => current ? {
      ...current,
      theme_schema: theme,
      primary_color: light.primary || current.primary_color,
      accent_color: light.accent || current.accent_color,
      background_color: light.background || current.background_color,
    } : current)
    setSaved(false)
    setThemeDraft(JSON.stringify(theme, null, 2))
    setThemeError(null)
  }

  const updatePaletteColor = (
    legacyKey: "primary_color" | "accent_color" | "background_color",
    token: "primary" | "accent" | "background",
    value: string
  ) => {
    if (!branding) return
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
      updateBranding(legacyKey, value)
      return
    }
    const theme = JSON.parse(JSON.stringify(branding.theme_schema)) as ThemeSchema
    theme.name = `${branding.template}-custom`
    theme.cssVars.light[token] = value
    if (token !== "background") theme.cssVars.dark[token] = value
    setBranding({ ...branding, [legacyKey]: value, theme_schema: theme })
    setThemeDraft(JSON.stringify(theme, null, 2))
    setThemeError(null)
    setSaved(false)
  }

  const applyThemeDraft = () => {
    try {
      const parsed = JSON.parse(themeDraft) as ThemeSchema
      if (parsed.type !== "registry:theme" || !parsed.cssVars?.light || !parsed.cssVars?.dark) throw new Error("invalid_theme")
      applyTheme(parsed)
    } catch (_parseError) {
      setThemeError(I18n.t("tenants.settings.theme_json_error"))
    }
  }

  const activateRuntimeTheme = (payload: { tenant: Tenant }) => {
    if (Number(window.ENV?.TENANT_ID) !== payload.tenant.id) return

    window.ENV.TENANT_TEMPLATE = payload.tenant.settings.template
    window.ENV.TENANT_THEME = payload.tenant.settings.theme_schema
    window.dispatchEvent(new CustomEvent("tenant-theme:change", { detail: payload.tenant.settings.theme_schema }))
  }

  const selectTemplate = async (template: TemplateKey) => {
    if (!branding || templateSaving) return

    const previousTheme = {
      template: branding.template,
      primary_color: branding.primary_color,
      accent_color: branding.accent_color,
      background_color: branding.background_color,
      theme_schema: branding.theme_schema,
    }
    const theme = cloneThemePreset(template)
    const light = theme.cssVars.light
    const nextTheme = {
      template,
      primary_color: light.primary || branding.primary_color,
      accent_color: light.accent || branding.accent_color,
      background_color: light.background || branding.background_color,
      theme_schema: theme,
    }

    setBranding({ ...branding, ...nextTheme })
    setThemeDraft(JSON.stringify(theme, null, 2))
    setThemeError(null)
    setTemplateSaving(true)
    setSaved(false)
    setError(null)

    const body = new FormData()
    body.append("tenant[template]", nextTheme.template)
    body.append("tenant[primary_color]", nextTheme.primary_color)
    body.append("tenant[accent_color]", nextTheme.accent_color)
    body.append("tenant[background_color]", nextTheme.background_color)
    body.append("tenant[theme_schema]", JSON.stringify(nextTheme.theme_schema))

    try {
      const response = await patch(`/tenants/${id}.json`, { body, responseKind: "json" })
      const payload = await response.json
      if (!response.ok) throw new Error("save_failed")

      setTenant(payload.tenant)
      setBranding((current) => current ? {
        ...current,
        template: payload.tenant.settings.template,
        primary_color: payload.tenant.settings.primary_color,
        accent_color: payload.tenant.settings.accent_color,
        background_color: payload.tenant.settings.background_color,
        theme_schema: payload.tenant.settings.theme_schema,
      } : current)
      setThemeDraft(JSON.stringify(payload.tenant.settings.theme_schema, null, 2))
      activateRuntimeTheme(payload)
    } catch (_requestError) {
      setBranding((current) => current ? { ...current, ...previousTheme } : current)
      setThemeDraft(JSON.stringify(previousTheme.theme_schema, null, 2))
      setError(I18n.t("tenants.settings.save_error"))
    } finally {
      setTemplateSaving(false)
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!branding) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const body = new FormData()
    body.append("tenant[name]", name)
    Object.entries(branding).forEach(([key, value]) => {
      if (key !== "tagline" && (value == null || (typeof value === "string" && !value.trim()))) return
      body.append(`tenant[${key}]`, key === "theme_schema" ? JSON.stringify(value) : String(value ?? ""))
    })
    if (logoFile) body.append("tenant[logo]", logoFile)

    try {
      const response = await patch(`/tenants/${id}.json`, { body, responseKind: "json" })
      const payload = await response.json
      if (!response.ok) throw new Error("save_failed")
      setTenant(payload.tenant)
      setBranding(payload.tenant.settings)
      setLogoPreview(payload.tenant.logo_url)
      setThemeDraft(JSON.stringify(payload.tenant.settings.theme_schema, null, 2))
      setLogoFile(null)
      setSaved(true)
      activateRuntimeTheme(payload)
    } catch (_requestError) {
      setError(I18n.t("tenants.settings.save_error"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  }

  if (!tenant || !branding) {
    return <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>{I18n.t("tenants.settings.unavailable")}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }

  return (
    <main className="relative min-h-screen overflow-hidden rounded-[2rem] border border-border/60 bg-background px-4 py-6 text-foreground sm:px-7 lg:px-10 lg:py-9">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Button variant="ghost" asChild className="-ml-3 mb-4 text-muted-foreground hover:text-accent-foreground"><a href="/tenants"><ArrowLeft className="mr-2 h-4 w-4" /> {I18n.t("tenants.common.back_to_tenants")}</a></Button>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary"><Sparkles className="h-4 w-4" /> {I18n.t("tenants.settings.studio")}</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{I18n.t("tenants.settings.title", { name: tenant.name })}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{I18n.t("tenants.settings.description")}</p>
          </div>
          <Button variant="outline" asChild><a href={tenant.preview_url} target="_blank" rel="noreferrer">{I18n.t("tenants.settings.view_site")} <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
        </header>

        {error && <Alert variant="destructive" className="mb-6"><CircleAlert className="h-4 w-4" /><AlertTitle>{I18n.t("tenants.settings.unsaved_title")}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <form onSubmit={save} className="grid gap-7 xl:grid-cols-[minmax(0,0.88fr)_minmax(30rem,1.12fr)]">
          <div className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> {I18n.t("tenants.settings.identity")}</CardTitle><CardDescription>{I18n.t("tenants.settings.identity_description")}</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2"><Label htmlFor="tenant-name">{I18n.t("tenants.settings.name")}</Label><Input id="tenant-name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} maxLength={80} /></div>
                <div className="space-y-2"><Label htmlFor="tenant-tagline">{I18n.t("tenants.settings.tagline")}</Label><Textarea id="tenant-tagline" value={branding.tagline || ""} onChange={(event) => updateBranding("tagline", event.target.value)} maxLength={160} placeholder={I18n.t("tenants.settings.tagline_placeholder")} /></div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-logo">{I18n.t("tenants.settings.logo")}</Label>
                  <label htmlFor="tenant-logo" className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-4 transition hover:border-primary/40">
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-muted/50">{logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" /> : <Upload className="h-5 w-5 text-muted-foreground" />}</div>
                    <div><p className="text-sm font-medium">{logoFile?.name || I18n.t("tenants.settings.upload_logo")}</p><p className="mt-1 text-xs text-muted-foreground">{I18n.t("tenants.settings.logo_help")}</p></div>
                  </label>
                  <Input id="tenant-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => { setLogoFile(event.target.files?.[0] || null); setSaved(false) }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-chart-2" /> {I18n.t("tenants.settings.palette")}</CardTitle><CardDescription>{I18n.t("tenants.settings.palette_description")}</CardDescription></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-3">
                <ColorField label={I18n.t("tenants.settings.primary")} value={branding.primary_color} onChange={(value) => updatePaletteColor("primary_color", "primary", value)} />
                <ColorField label={I18n.t("tenants.settings.accent")} value={branding.accent_color} onChange={(value) => updatePaletteColor("accent_color", "accent", value)} />
                <ColorField label={I18n.t("tenants.settings.background")} value={branding.background_color} onChange={(value) => updatePaletteColor("background_color", "background", value)} />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-chart-4" /> {I18n.t("tenants.settings.typography")}</CardTitle></CardHeader>
              <CardContent>
                <Select value={branding.heading_font} onValueChange={(value) => { if (value) updateBranding("heading_font", value as HeadingFont) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(fontLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle>{I18n.t("tenants.settings.template")}</CardTitle><CardDescription>{I18n.t("tenants.settings.template_description")}</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {templates.map((template) => {
                  const selected = branding.template === template.key
                  const presetColors = themePresets[template.key].cssVars.light
                  const colors = selected ? branding.theme_schema.cssVars.light : presetColors

                  return (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => selectTemplate(template.key)}
                      disabled={templateSaving}
                      aria-pressed={selected}
                      className={cn(
                        "relative min-h-40 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 disabled:cursor-wait disabled:opacity-70",
                        selected ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border bg-muted/30"
                      )}
                    >
                      {selected && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">{templateSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}</span>}
                      <div className="mb-4 flex gap-1.5" aria-hidden="true">
                        {[colors.background, colors.foreground, colors.primary, colors.accent].map((color, index) => (
                          <span key={`${color}-${index}`} className="h-5 w-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <p className="pr-7 text-sm font-semibold">{template.name}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Braces className="h-5 w-5 text-primary" /> {I18n.t("tenants.settings.theme_json")}</CardTitle>
                    <CardDescription className="mt-2">{I18n.t("tenants.settings.theme_json_description")}</CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <CardContent className="space-y-4 border-t border-border pt-6">
                  <Textarea
                    value={themeDraft}
                    onChange={(event) => { setThemeDraft(event.target.value); setThemeError(null); setSaved(false) }}
                    className="min-h-64 resize-y font-mono text-xs leading-relaxed"
                    spellCheck={false}
                    aria-invalid={Boolean(themeError)}
                  />
                  {themeError && <p className="text-sm font-medium text-destructive">{themeError}</p>}
                  <Button type="button" variant="outline" onClick={applyThemeDraft}><Braces className="mr-2 h-4 w-4" /> {I18n.t("tenants.settings.apply_theme_json")}</Button>
                </CardContent>
              </details>
            </Card>

            <BrandPreview tenant={{ ...tenant, name }} branding={branding} logoPreview={logoPreview} />

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur">
              <div><p className="text-sm font-medium">{saved ? I18n.t("tenants.settings.saved") : I18n.t("tenants.settings.configuration")}</p><p className="mt-1 text-xs text-muted-foreground">{I18n.t("tenants.settings.preview_help")}</p></div>
              <Button type="submit" disabled={saving || !tenant.can_manage_settings} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {I18n.t("tenants.common.save")}</Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
