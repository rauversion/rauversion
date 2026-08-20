import React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import I18n from "@/stores/locales"
import useAuthStore from "@/stores/authStore"

export default function StripeSellerSetupDialog({ backPath }) {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const productsPath = backPath || `/${currentUser?.username}/products`
  const stripeSettingsPath = `/${currentUser?.username}/settings/stripe`

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <DialogTitle>{I18n.t("products.stripe_gate.title")}</DialogTitle>
            <DialogDescription>
              {I18n.t("products.stripe_gate.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>{I18n.t("products.stripe_gate.body")}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => navigate(productsPath)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {I18n.t("products.stripe_gate.back")}
            </Button>
            <Button type="button" onClick={() => navigate(stripeSettingsPath)}>
              <CreditCard className="mr-2 h-4 w-4" />
              {I18n.t("products.stripe_gate.cta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
