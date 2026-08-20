import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { get, post } from "@rails/request.js"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Clipboard,
  Globe2,
  Loader2,
  LockKeyhole,
  Music2,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const tenantSchema = z.object({
  name: z.string().trim().min(2, "Ingresa al menos 2 caracteres").max(80, "Máximo 80 caracteres"),
  slug: z
    .string()
    .trim()
    .min(3, "Usa al menos 3 caracteres")
    .max(63, "Máximo 63 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones"),
})

type TenantForm = z.infer<typeof tenantSchema>
type Availability = "idle" | "checking" | "available" | "taken" | "reserved" | "invalid" | "error"
type CreatedTenant = {
  id: number
  name: string
  slug: string
  role: string
  subdomain: string
  url: string
}

const availabilityCopy: Record<Availability, string> = {
  idle: "Elige la dirección de tu espacio",
  checking: "Comprobando disponibilidad…",
  available: "Disponible",
  taken: "Ese nombre ya está en uso",
  reserved: "Ese nombre está reservado por Rauversion",
  invalid: "Revisa el formato del subdominio",
  error: "No pudimos validar ahora; inténtalo nuevamente",
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2 pl-3">
      <code className="min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm">{value}</code>
      <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label="Copiar valor">
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
      </Button>
    </div>
  )
}

function SuccessView({ tenant }: { tenant: CreatedTenant }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Espacio creado</p>
            <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
          </div>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Owner
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="overflow-hidden border-border/70 bg-card/80 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-chart-2/10">
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              Tu dirección Rauversion
            </CardTitle>
            <CardDescription>Esta será la entrada canónica mientras conectas tu dominio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <CopyValue value={tenant.url} />
            <Alert className="border-chart-4/20 bg-chart-4/10">
              <CircleDashed className="h-4 w-4 text-chart-4" />
              <AlertTitle>Tenant listo para recibir contenido</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                El backend ya resuelve el contexto por host y mantiene el contenido del espacio aislado. En producción todavía debes configurar el DNS wildcard.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/">Volver a Rauversion <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-lg">Conectar un dominio propio</CardTitle>
            <CardDescription>Guía anticipada; todavía no debes cambiar tu DNS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4 text-sm">
              {[
                ["1", "Verificar propiedad", "Publicaremos un registro TXT único para tu dominio."],
                ["2", "Apuntar el tráfico", "Configurarás un CNAME hacia domains.rauversion.com."],
                ["3", "Activar HTTPS", "Rauversion solicitará y renovará el certificado automáticamente."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-muted text-xs font-semibold">{number}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <p className="text-xs leading-relaxed text-muted-foreground">
              No mostraremos contenido de <strong className="text-foreground">{tenant.name}</strong> en el tenant central salvo que lo publiques explícitamente allí.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TenantOnboarding() {
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [availability, setAvailability] = React.useState<Availability>("idle")
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [createdTenant, setCreatedTenant] = React.useState<CreatedTenant | null>(null)

  const form = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    mode: "onChange",
    defaultValues: { name: "", slug: "" },
  })

  const name = form.watch("name")
  const slug = form.watch("slug")

  React.useEffect(() => {
    if (!slugEdited) {
      form.setValue("slug", slugify(name), { shouldValidate: name.length > 1 })
    }
  }, [form, name, slugEdited])

  React.useEffect(() => {
    if (!slug) {
      setAvailability("idle")
      return
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 63) {
      setAvailability("invalid")
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setAvailability("checking")
      try {
        const response = await get(`/tenants/availability.json?slug=${encodeURIComponent(slug)}`)
        const body = await response.json
        if (!active) return
        setAvailability(body.available ? "available" : body.reason || "taken")
      } catch (_error) {
        if (active) setAvailability("error")
      }
    }, 400)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [slug])

  const submit = async (values: TenantForm) => {
    setServerError(null)

    if (availability !== "available") {
      form.setError("slug", { message: "Elige un subdominio disponible" })
      return
    }

    try {
      const response = await post("/tenants.json", {
        body: { tenant: values },
        responseKind: "json",
      })
      const body = await response.json

      if (response.ok) {
        setCreatedTenant(body.tenant)
        return
      }

      Object.entries(body.errors || {}).forEach(([field, messages]) => {
        if (field === "name" || field === "slug") {
          form.setError(field, { message: (messages as string[]).join(", ") })
        }
      })
      setServerError("No pudimos crear el espacio. Revisa los datos e inténtalo nuevamente.")
    } catch (_error) {
      setServerError("No pudimos comunicarnos con Rauversion. Inténtalo nuevamente.")
    }
  }

  if (createdTenant) return <SuccessView tenant={createdTenant} />

  const statusIsPositive = availability === "available"
  const progress = form.formState.isValid && statusIsPositive ? 100 : name.length >= 2 ? 58 : 25

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-[2rem] border border-border/50 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
        <section className="space-y-8 lg:pr-6">
          <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/90/10">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Rauversion for teams
          </Badge>
          <div>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Tu catálogo. Tu equipo. Tu dirección.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Crea un espacio independiente para tu sello, colectivo o proyecto. Tú controlas quién entra y qué se publica.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              [LockKeyhole, "Datos aislados", "Tu catálogo no aparece en el tenant central."],
              [Users2, "Roles por equipo", "Serás owner y podrás sumar artistas después."],
              [Music2, "Listo para crecer", "Álbumes, tracks y ventas vivirán en este espacio."],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as React.ElementType
              return (
                <div key={title as string} className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
                  <FeatureIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{title as string}</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground0">{description as string}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <Card className="border-border bg-card/90 text-foreground shadow-2xl shadow-foreground/10 backdrop-blur-xl">
          <CardHeader className="space-y-5 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl tracking-tight">Crear un tenant</CardTitle>
                <CardDescription className="mt-1.5 text-muted-foreground">Primero define su identidad y dirección interna.</CardDescription>
              </div>
              <span className="text-xs font-medium text-foreground0">Paso 1 de 2</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-muted [&>div]:bg-primary" />
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-7">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Nombre del espacio</FormLabel>
                      <FormControl>
                        <Input {...field} autoFocus placeholder="Ej. Sello Cordillera" className="h-12 border-border bg-muted/40 text-base placeholder:text-muted-foreground/60" />
                      </FormControl>
                      <FormDescription className="text-foreground0">Puedes cambiar el nombre visible más adelante.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Subdominio Rauversion</FormLabel>
                      <FormControl>
                        <div className="flex h-12 overflow-hidden rounded-md border border-border bg-muted/40 focus-within:ring-2 focus-within:ring-ring/50">
                          <Input
                            {...field}
                            onChange={(event) => {
                              setSlugEdited(true)
                              field.onChange(slugify(event.target.value))
                            }}
                            placeholder="sello-cordillera"
                            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent text-base focus-visible:ring-0"
                          />
                          <div className="flex items-center border-l border-border px-3 text-sm text-foreground0">.rauversion.com</div>
                        </div>
                      </FormControl>
                      <div className="flex min-h-5 items-center gap-2 text-xs">
                        {availability === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        {statusIsPositive && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        <span className={cn(statusIsPositive ? "text-primary" : "text-foreground0", ["taken", "reserved", "invalid", "error"].includes(availability) && "text-destructive")}>
                          {availabilityCopy[availability]}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="border-chart-2/20 bg-chart-2/10 text-foreground/80">
                  <ShieldCheck className="h-4 w-4 text-chart-2" />
                  <AlertTitle>Qué ocurrirá al continuar</AlertTitle>
                  <AlertDescription className="text-foreground0">
                    Crearemos el tenant y una membresía <strong className="text-foreground/80">owner</strong> para tu cuenta. El nuevo espacio comenzará con un catálogo vacío.
                  </AlertDescription>
                </Alert>

                {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || availability !== "available"}
                  className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Crear mi espacio
                  {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
