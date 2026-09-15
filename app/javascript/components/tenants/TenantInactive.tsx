import React from "react"
import I18n from "@/stores/locales"
import { CreditCard, LogIn, Settings2 } from "lucide-react"
import useAuthStore from "@/stores/authStore"
import { Button } from "@/components/ui/button"

type TenantContext = {
  id: number
  name: string
  slug: string
  central: boolean
  logo_url: string | null
  role: string | null
}

export default function TenantInactive() {
  const tenant = useAuthStore((state: any) => state.tenant as TenantContext | null)
  const currentUser = useAuthStore((state: any) => state.currentUser)
  const canManageBilling = ["owner", "admin"].includes(tenant?.role || "")

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px]" />

      <section className="w-full max-w-xl rounded-[2rem] border border-border bg-card/80 p-8 shadow-2xl shadow-foreground/10 backdrop-blur-xl sm:p-12">
        <div className="flex items-center gap-4">
          <div className="flex h-16 min-w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/50 p-2">
            <img
              src={tenant?.logo_url || "/logo.png"}
              className="max-h-12 max-w-32 object-contain"
              alt={tenant?.name ? I18n.t("tenants.inactive.logo_alt", { name: tenant.name }) : I18n.t("tenants.common.logo")}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Rauversion</p>
            <h1 className="mt-1 truncate text-2xl font-semibold">{tenant?.name || I18n.t("tenants.common.tenant")}</h1>
          </div>
        </div>

        <div className="my-9 h-px bg-gradient-to-r from-primary/50 via-border to-transparent" />

        <p className="text-sm font-medium uppercase tracking-[0.22em] text-foreground0">{I18n.t("tenants.inactive.eyebrow")}</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{I18n.t("tenants.inactive.title")}</h2>
        <p className="mt-4 max-w-md leading-7 text-muted-foreground">
          {I18n.t("tenants.inactive.description")}
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          {canManageBilling ? (
            <>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="/billing"><CreditCard className="mr-2 h-4 w-4" /> {I18n.t("tenants.inactive.reactivate")}</a>
              </Button>
              <Button asChild variant="outline" className="border-border bg-transparent text-foreground hover:bg-muted/50 hover:text-accent-foreground">
                <a href="/admin"><Settings2 className="mr-2 h-4 w-4" /> {I18n.t("tenants.inactive.open_admin")}</a>
              </Button>
            </>
          ) : currentUser ? (
            <Button asChild variant="outline" className="border-border bg-transparent text-foreground hover:bg-muted/50 hover:text-accent-foreground">
              <a href="/tenants">{I18n.t("tenants.inactive.view_tenants")}</a>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-border bg-transparent text-foreground hover:bg-muted/50 hover:text-accent-foreground">
              <a href="/users/sign_in"><LogIn className="mr-2 h-4 w-4" /> {I18n.t("tenants.inactive.sign_in")}</a>
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
