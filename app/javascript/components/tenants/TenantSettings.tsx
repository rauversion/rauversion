import React from "react"
import { get, patch } from "@rails/request.js"
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
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

type TemplateKey = "amplifier" | "editorial" | "waveform"
type HeadingFont = "space_grotesk" | "archivo_clash" | "ibm_plex"

type Branding = {
  tagline: string
  template: TemplateKey
  primary_color: string
  accent_color: string
  background_color: string
  heading_font: HeadingFont
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
  { key: "amplifier", name: "Amplifier", description: "Portadas grandes, lanzamientos al frente y energía de sello independiente." },
  { key: "editorial", name: "Editorial", description: "Tipografía protagonista, ritmo de revista y espacio para historias." },
  { key: "waveform", name: "Waveform", description: "Interfaz compacta orientada a catálogo, playlists y escucha continua." },
]

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
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="font-mono uppercase" maxLength={7} />
      </div>
    </div>
  )
}

function BrandPreview({ tenant, branding, logoPreview }: { tenant: Tenant; branding: Branding; logoPreview: string | null }) {
  const templateClass = {
    amplifier: "rounded-[2rem]",
    editorial: "rounded-none",
    waveform: "rounded-xl",
  }[branding.template]

  return (
    <div
      className={cn("relative isolate min-h-[31rem] overflow-hidden border border-border p-7 shadow-2xl", templateClass)}
      style={{ backgroundColor: branding.background_color }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: branding.primary_color }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo del tenant" className="h-11 w-11 rounded-xl object-contain" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-xl font-bold text-primary-foreground" style={{ backgroundColor: branding.primary_color }}>
              {tenant.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-semibold text-white">{tenant.name}</span>
        </div>
        <div className="flex gap-4 text-[10px] uppercase tracking-[0.18em] text-white/50">
          <span>Música</span><span>Eventos</span><span>Tienda</span>
        </div>
      </div>

      <div className={cn("relative mt-24", branding.template === "editorial" && "mt-16 border-l pl-6")} style={{ borderColor: branding.accent_color }}>
        <Badge className="border-0 text-primary-foreground" style={{ backgroundColor: branding.accent_color }}>Nueva temporada</Badge>
        <h2 className="mt-5 max-w-md text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl">
          {branding.tagline || "Sonido propio. Espacio propio."}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
          Un hogar independiente para artistas, lanzamientos y comunidad.
        </p>
        <Button className="mt-7 border-0 text-primary-foreground" style={{ backgroundColor: branding.primary_color }}>Explorar catálogo</Button>
      </div>

      <div className="absolute inset-x-7 bottom-7 grid grid-cols-3 gap-2">
        {["Último release", "Próximo evento", "Selección"].map((label, index) => (
          <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="mb-3 h-1 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${82 - index * 18}%`, backgroundColor: index === 1 ? branding.accent_color : branding.primary_color }} /></div>
            <p className="text-[10px] text-white/45">{label}</p>
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
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

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
      })
      .catch(() => active && setError("No pudimos cargar la configuración del tenant."))
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!branding) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const body = new FormData()
    body.append("tenant[name]", name)
    Object.entries(branding).forEach(([key, value]) => body.append(`tenant[${key}]`, value))
    if (logoFile) body.append("tenant[logo]", logoFile)

    try {
      const response = await patch(`/tenants/${id}.json`, { body, responseKind: "json" })
      const payload = await response.json
      if (!response.ok) throw new Error("save_failed")
      setTenant(payload.tenant)
      setBranding(payload.tenant.settings)
      setLogoPreview(payload.tenant.logo_url)
      setLogoFile(null)
      setSaved(true)
    } catch (_requestError) {
      setError("No pudimos guardar. Revisa los colores y vuelve a intentarlo.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  }

  if (!tenant || !branding) {
    return <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>Configuración no disponible</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }

  return (
    <main className="relative min-h-screen overflow-hidden rounded-[2rem] border border-border/60 bg-background px-4 py-6 text-foreground sm:px-7 lg:px-10 lg:py-9">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Button variant="ghost" asChild className="-ml-3 mb-4 text-muted-foreground hover:text-accent-foreground"><a href="/tenants"><ArrowLeft className="mr-2 h-4 w-4" /> Tenants</a></Button>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary"><Sparkles className="h-4 w-4" /> Estudio de marca</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Configura {tenant.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Define la identidad del tenant. Estos valores quedan disponibles para el storefront y sus futuras plantillas.</p>
          </div>
          <Button variant="outline" asChild><a href={tenant.preview_url} target="_blank" rel="noreferrer">Ver sitio <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
        </header>

        {error && <Alert variant="destructive" className="mb-6"><CircleAlert className="h-4 w-4" /><AlertTitle>No se guardaron los cambios</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <form onSubmit={save} className="grid gap-7 xl:grid-cols-[minmax(0,0.88fr)_minmax(30rem,1.12fr)]">
          <div className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Identidad</CardTitle><CardDescription>Nombre, mensaje y logo principal.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2"><Label htmlFor="tenant-name">Nombre</Label><Input id="tenant-name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} maxLength={80} /></div>
                <div className="space-y-2"><Label htmlFor="tenant-tagline">Tagline</Label><Textarea id="tenant-tagline" value={branding.tagline || ""} onChange={(event) => updateBranding("tagline", event.target.value)} maxLength={160} placeholder="La idea que define tu catálogo" /></div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-logo">Logo</Label>
                  <label htmlFor="tenant-logo" className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-4 transition hover:border-primary/40">
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-muted/50">{logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" /> : <Upload className="h-5 w-5 text-foreground0" />}</div>
                    <div><p className="text-sm font-medium">{logoFile?.name || "Subir logo"}</p><p className="mt-1 text-xs text-foreground0">PNG, JPG, WebP o SVG. Recomendado 512 x 512.</p></div>
                  </label>
                  <Input id="tenant-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => { setLogoFile(event.target.files?.[0] || null); setSaved(false) }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-chart-2" /> Paleta</CardTitle><CardDescription>Colores base usados por botones, acentos y fondos.</CardDescription></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <ColorField label="Primario" value={branding.primary_color} onChange={(value) => updateBranding("primary_color", value)} />
                <ColorField label="Acento" value={branding.accent_color} onChange={(value) => updateBranding("accent_color", value)} />
                <div className="sm:col-span-2"><ColorField label="Fondo" value={branding.background_color} onChange={(value) => updateBranding("background_color", value)} /></div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-chart-4" /> Tipografía</CardTitle></CardHeader>
              <CardContent>
                <Select value={branding.heading_font} onValueChange={(value) => updateBranding("heading_font", value as HeadingFont)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(fontLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle>Plantilla</CardTitle><CardDescription>Elige la dirección visual del storefront.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {templates.map((template) => (
                  <button key={template.key} type="button" onClick={() => updateBranding("template", template.key)} className={cn("relative rounded-xl border p-4 text-left transition", branding.template === template.key ? "border-primary/50 bg-primary/10" : "border-border bg-muted/30 hover:border-border")}>
                    {branding.template === template.key && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                    <p className="text-sm font-semibold">{template.name}</p><p className="mt-2 text-xs leading-relaxed text-foreground0">{template.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <BrandPreview tenant={{ ...tenant, name }} branding={branding} logoPreview={logoPreview} />

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur">
              <div><p className="text-sm font-medium">{saved ? "Cambios guardados" : "Configuración del tenant"}</p><p className="mt-1 text-xs text-foreground0">La vista previa se actualiza antes de publicar.</p></div>
              <Button type="submit" disabled={saving || !tenant.can_manage_settings} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar</Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
