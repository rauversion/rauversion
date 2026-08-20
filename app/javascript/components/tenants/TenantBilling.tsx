import React from "react"
import { get, post } from "@rails/request.js"
import { ArrowLeft, Check, CircleAlert, CreditCard, ExternalLink, Loader2, ShieldCheck, Sparkles } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Price = { id: number; currency: string; amount_cents: number; billing_interval: string; checkout_available: boolean }
type Plan = { id: number; code: string; name: string; description: string; entitlements: Record<string, boolean | number | null>; prices: Price[] }
type Subscription = { status: string; plan_code: string; plan_name: string; current_period_ends_at?: string; trial_ends_at?: string; cancel_at_period_end: boolean; grace_period_ends_at?: string; portal_available: boolean }
type BillingData = { tenant: { id: number; name: string; slug: string; central: boolean }; disabled: boolean; accessible: boolean; subscription: Subscription | null; plans: Plan[] }

const featureLabels: Record<string, string> = {
  custom_branding: "Branding personalizado",
  custom_domain: "Dominio propio",
  advanced_analytics: "Analytics avanzados",
  max_members: "Miembros",
  max_artists: "Artistas",
  max_tracks: "Tracks",
  storage_gb: "GB de almacenamiento",
}

function formatPrice(price: Price) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: price.currency }).format(price.amount_cents / 100)
}

export default function TenantBilling() {
  const [data, setData] = React.useState<BillingData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submittingId, setSubmittingId] = React.useState<number | null>(null)
  const [portalLoading, setPortalLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    get("/tenant_billing.json")
      .then(async (response) => {
        const payload = await response.json
        if (!response.ok) throw new Error(payload.error || "billing_load_failed")
        setData(payload)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const checkout = async (price: Price) => {
    setSubmittingId(price.id)
    setError(null)
    try {
      const response = await post("/tenant_billing/checkout.json", { body: { plan_price_id: price.id }, responseKind: "json" })
      const payload = await response.json
      if (!response.ok) throw new Error(payload.error || "checkout_failed")
      window.location.assign(payload.checkout_url)
    } catch (requestError: any) {
      setError(requestError.message)
      setSubmittingId(null)
    }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const response = await post("/tenant_billing/portal.json", { responseKind: "json" })
      const payload = await response.json
      if (!response.ok) throw new Error(payload.error || "portal_failed")
      window.location.assign(payload.portal_url)
    } catch (requestError: any) {
      setError(requestError.message)
      setPortalLoading(false)
    }
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  if (!data) return <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>Billing no disponible</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>

  return (
    <main className="relative min-h-screen overflow-hidden rounded-[2rem] border border-border/60 bg-background px-5 py-8 text-foreground sm:px-8 lg:px-12 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="relative mx-auto max-w-6xl">
        <Button variant="ghost" asChild className="-ml-3 mb-6 text-muted-foreground"><a href="/tenants"><ArrowLeft className="mr-2 h-4 w-4" /> Tenants</a></Button>
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary"><Sparkles className="h-4 w-4" /> Plan del tenant</div><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Activa {data.tenant.name}</h1><p className="mt-3 max-w-xl text-muted-foreground">El plan controla acceso, límites y capacidades comerciales de este espacio.</p></div>
          {data.subscription?.portal_available && <Button variant="outline" onClick={openPortal} disabled={portalLoading}>{portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />} Portal de facturación</Button>}
        </header>

        {data.disabled && <Alert className="mt-8 border-chart-4/20 bg-chart-4/10"><ShieldCheck className="h-4 w-4 text-chart-4" /><AlertTitle>Suscripciones deshabilitadas</AlertTitle><AlertDescription>DISABLE_TENANT_SUBSCRIPTION está activo. El tenant tiene acceso sin cobro en este ambiente.</AlertDescription></Alert>}
        {data.tenant.central && <Alert className="mt-8 border-chart-2/20 bg-chart-2/10"><ShieldCheck className="h-4 w-4 text-chart-2" /><AlertTitle>Tenant global</AlertTitle><AlertDescription>El tenant central está exento de suscripción.</AlertDescription></Alert>}
        {data.subscription && <Card className="mt-8 border-primary/20 bg-primary/5"><CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Plan actual</p><p className="mt-2 text-xl font-semibold">{data.subscription.plan_name}</p><p className="mt-1 text-sm text-muted-foreground">Estado: {data.subscription.status}</p></div><Badge className="w-fit bg-primary text-primary-foreground">{data.accessible ? "Acceso habilitado" : "Pendiente"}</Badge></CardContent></Card>}
        {error && <Alert variant="destructive" className="mt-6"><CircleAlert className="h-4 w-4" /><AlertTitle>No se pudo completar la operación</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <section className="mt-9 grid gap-5 lg:grid-cols-3">
          {data.plans.map((plan, index) => {
            const price = plan.prices[0]
            const current = data.subscription?.plan_code === plan.code
            return <Card key={plan.id} className={cn("relative overflow-hidden border-border bg-card", index === 1 && "border-primary/35 bg-primary/5")}>
              {index === 1 && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-chart-2" />}
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-2xl">{plan.name}</CardTitle>{current && <Badge variant="outline">Actual</Badge>}</div><CardDescription className="min-h-10">{plan.description}</CardDescription>{price && <div className="pt-4"><span className="text-3xl font-semibold">{formatPrice(price)}</span><span className="text-sm text-foreground0"> / {price.billing_interval === "year" ? "año" : "mes"}</span></div>}</CardHeader>
              <CardContent className="space-y-5"><div className="space-y-3">{Object.entries(plan.entitlements).filter(([key, value]) => key !== "tenant_access" && value !== false).slice(0, 7).map(([key, value]) => <div key={key} className="flex items-center gap-2 text-sm text-foreground/80"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span><span>{typeof value === "number" ? `${value} ` : ""}{featureLabels[key] || key.replaceAll("_", " ")}</span></div>)}</div><Button className="w-full" disabled={data.disabled || data.tenant.central || current || !price?.checkout_available || submittingId !== null} onClick={() => price && checkout(price)}>{submittingId === price?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}{current ? "Plan actual" : price?.checkout_available ? "Elegir plan" : "Configura Stripe Price"}</Button></CardContent>
            </Card>
          })}
        </section>
      </div>
    </main>
  )
}
