import React from "react"
import BroadcastHome from "@/components/home/BroadcastHome"

type PreviewTenant = {
  name: string
  slug: string
  logo_url: string | null
  settings: { tagline: string }
}

export default function BroadcastPreview({ tenant, theme }: {
  tenant: PreviewTenant
  theme: { cssVars: { theme?: Record<string, string>; light: Record<string, string> } }
}) {
  const variables = { ...theme.cssVars.theme, ...theme.cssVars.light }
  const style = Object.fromEntries(Object.entries(variables).map(([key, value]) => [`--${key}`, value])) as React.CSSProperties

  return (
    <div className="broadcast-preview" data-tenant-template="broadcast" style={style}>
      <div {...{ inert: "", "aria-hidden": true }}>
        <BroadcastHome tenant={tenant} data={{}} preview />
      </div>
    </div>
  )
}
