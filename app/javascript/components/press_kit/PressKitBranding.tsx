import React from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, Layers } from "lucide-react"
import { useLocaleStore } from "stores/locales"
import useAuthStore from "@/stores/authStore"

export default function PressKitBranding() {
  const { i18n } = useLocaleStore
  const { currentUser } = useAuthStore()
  const createPath = currentUser?.username ? `/${currentUser.username}/press-kit?edit=1` : "/users/sign_up"

  return (
    <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-border bg-secondary/30 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-primary" />{i18n.t("press_kit.footer.made_with")}</p>
        <p className="max-w-md text-sm text-muted-foreground">{i18n.t("press_kit.footer.create_description")}</p>
      </div>
      <Link to={createPath} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {i18n.t("press_kit.footer.create_yours")}<ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
