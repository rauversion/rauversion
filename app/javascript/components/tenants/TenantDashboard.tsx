import React from "react"
import { get } from "@rails/request.js"
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  Crown,
  Globe2,
  Loader2,
  Plus,
  Radio,
  Settings2,
  ShieldCheck,
  Users2,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Tenant = {
  id: number
  name: string
  slug: string
  central: boolean
  role: "member" | "artist" | "editor" | "admin" | "owner"
  preview_url: string
  admin_url: string
  can_manage_settings: boolean
}

const roleLabels: Record<Tenant["role"], string> = {
  member: "Miembro",
  artist: "Artista",
  editor: "Editor",
  admin: "Admin",
  owner: "Owner",
}

function TenantCard({
  tenant,
  active,
  activating,
  onActivate,
}: {
  tenant: Tenant
  active: boolean
  activating: boolean
  onActivate: (tenant: Tenant) => void
}) {
  return (
    <Card className={cn(
      "group relative overflow-hidden border-border/70 bg-card/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/20",
      active && "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
    )}>
      {active && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-chart-2" />}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl border border-border bg-muted text-muted-foreground",
            active && "border-primary/20 bg-primary/10 text-primary"
          )}>
            {tenant.central ? <Radio className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </div>
          <div className="flex items-center gap-2">
            {tenant.role === "owner" && <Crown className="h-4 w-4 text-chart-4" />}
            <Badge variant="outline" className="text-xs">{roleLabels[tenant.role]}</Badge>
          </div>
        </div>
        <div className="pt-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            {tenant.name}
            {active && <Check className="h-4 w-4 text-primary" />}
          </CardTitle>
          <CardDescription className="mt-1 font-mono text-xs">
            {tenant.central ? "rauversion.com" : `${tenant.slug}.rauversion.com`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> Acceso verificado</span>
          <span>{tenant.central ? "Plataforma central" : "Tenant privado"}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Button
            type="button"
            disabled={active || activating}
            onClick={() => onActivate(tenant)}
            className={cn(active && "border border-primary/20 bg-primary/10 text-primary")}
            variant={active ? "outline" : "default"}
          >
            {activating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {active ? "Tenant activo" : "Entrar al tenant"}
            {!active && !activating && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
          {tenant.can_manage_settings && (
            <Button type="button" variant="outline" size="icon" asChild title="Configurar tenant">
              <a href={`/tenants/${tenant.id}/settings`}>
                <Settings2 className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button type="button" variant="outline" size="icon" asChild title="Abrir host del tenant">
            <a href={tenant.preview_url} target="_blank" rel="noreferrer">
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TenantDashboard() {
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [currentTenantId, setCurrentTenantId] = React.useState<number | null>(null)
  const [activatingId, setActivatingId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await get("/tenants.json")
        const body = await response.json
        if (!active) return

        if (!response.ok) throw new Error("request_failed")
        setTenants(body.tenants)
        setCurrentTenantId(body.current_tenant_id)
      } catch (_requestError) {
        if (active) setError("No pudimos cargar tus tenants.")
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const activate = (tenant: Tenant) => {
    setActivatingId(tenant.id)
    setError(null)
    window.location.assign(tenant.admin_url)
  }

  return (
    <main className="relative min-h-[calc(100vh-9rem)] overflow-hidden rounded-[2rem] border border-border/60 bg-background px-5 py-8 text-foreground sm:px-8 lg:px-12 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Globe2 className="h-4 w-4" /> Control de espacios
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Tus tenants</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Cambia el contexto de administración o abre el host público de cada proyecto.
            </p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <a href="/tenants/new"><Plus className="mr-2 h-4 w-4" /> Nuevo tenant</a>
          </Button>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-foreground0">Espacios disponibles</p>
            <p className="mt-2 text-2xl font-semibold">{loading ? "—" : tenants.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-foreground0">Contexto actual</p>
            <p className="mt-2 truncate text-sm font-medium text-foreground">
              {loading ? "Cargando…" : tenants.find((tenant) => tenant.id === currentTenantId)?.name || "Sin seleccionar"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-foreground0">Aislamiento de catálogo</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" /> Contenido aislado</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>No se pudo completar la operación</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading && [1, 2, 3].map((item) => (
            <Card key={item} className="border-border bg-card/60 p-6">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="mt-6 h-6 w-2/3" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-8 h-10 w-full" />
            </Card>
          ))}
          {!loading && tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              active={tenant.id === currentTenantId}
              activating={tenant.id === activatingId}
              onActivate={activate}
            />
          ))}
        </section>

        <Alert className="mt-8 border-chart-2/20 bg-chart-2/10 text-foreground/80">
          <ShieldCheck className="h-4 w-4 text-chart-2" />
          <AlertTitle>Cómo probar el tenant “test” en Rails development</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-muted-foreground">
            <p>Usa <strong className="text-foreground">Entrar al tenant</strong> para abrir su admin en el host correspondiente.</p>
            <p>Usa el botón externo para abrir <code className="rounded bg-black/30 px-1.5 py-0.5 text-chart-2">test.lvh.me:3000</code>; lvh.me resuelve automáticamente a 127.0.0.1.</p>
          </AlertDescription>
        </Alert>
      </div>
    </main>
  )
}
