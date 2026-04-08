import React from "react"
import { Link, useParams } from "react-router-dom"
import { ExternalLink, Monitor, Sparkles } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import {
  fetchEditableEventSite,
  saveEventSiteMode,
  type EventSiteMode,
  type EventSiteRecord,
} from "@/lib/event-sites"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Site() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [eventSite, setEventSite] = React.useState<EventSiteRecord | null>(null)
  const [siteMode, setSiteMode] = React.useState<EventSiteMode>("default")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!slug) return

    let cancelled = false

    const loadEventSite = async () => {
      try {
        const record = await fetchEditableEventSite(slug)

        if (cancelled) return

        setEventSite(record)
        setSiteMode(record.siteMode)
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Error",
            description: "No se pudo cargar la configuracion del sitio",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEventSite()

    return () => {
      cancelled = true
    }
  }, [slug, toast])

  const handleSave = async () => {
    if (!slug) return

    setSaving(true)

    try {
      const updated = await saveEventSiteMode(slug, siteMode)
      setEventSite((current) => ({
        ...(current || updated),
        ...updated,
      }))
      setSiteMode(updated.siteMode)
      toast({
        title: "Sitio actualizado",
        description: "El modo del sitio fue guardado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el sitio",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando sitio...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sitio del evento
          </CardTitle>
          <CardDescription>
            Define si este evento usa el sitio default de Rauversion o un sitio completamente customizado con el editor nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Modo del sitio</div>
            <Select value={siteMode} onValueChange={(value) => setSiteMode(value as EventSiteMode)}>
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sitio default</SelectItem>
                <SelectItem value="custom">Sitio totalmente customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm font-medium">Sitio actual</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {siteMode === "custom"
                  ? "El evento usará las páginas del editor nuevo cuando visites la URL pública."
                  : "El evento seguirá mostrando la plantilla default actual."}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm font-medium">Páginas custom</div>
              <div className="mt-2 text-2xl font-semibold">{eventSite?.sitePages.length || 0}</div>
              <div className="text-sm text-muted-foreground">
                Puedes mantener estas páginas guardadas aunque el sitio siga en modo default.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar modo"}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/events/${eventSite?.slug || slug}/editor`}>
                <Sparkles className="h-4 w-4" />
                Abrir editor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/events/${eventSite?.slug || slug}/preview`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir preview
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
