"use client"

import React from "react"
import { Copy, Info, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import useAuthStore from "@/stores/authStore"
import {
  buildEmailVariableMap,
  getEmailVariableExamples,
  type EmailVariableCategory,
} from "@/lib/email-editor/variables"

const categoryTitles: Record<EmailVariableCategory, string> = {
  recipient: "Destinatario",
  sender: "Remitente",
  system: "Sistema",
}

export function EmailVariablesDialog() {
  const { currentUser, env } = useAuthStore()
  const [copied, setCopied] = React.useState<string | null>(null)

  const variables = React.useMemo(
    () => getEmailVariableExamples(buildEmailVariableMap({ sender: currentUser, appName: env?.app_name })),
    [currentUser, env?.app_name]
  )

  const grouped = React.useMemo(() => {
    return {
      recipient: variables.filter((item) => item.category === "recipient"),
      sender: variables.filter((item) => item.category === "sender"),
      system: variables.filter((item) => item.category === "system"),
    }
  }, [variables])

  const copyToken = async (key: string) => {
    await navigator.clipboard.writeText(`{{${key}}}`)
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1200)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Info className="mr-1 h-4 w-4" />
          Variables
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[440px] max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Variables disponibles</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Usa formato tipo mustache como <code>{"{{name}}"}</code>. En preview se usan valores demo del destinatario; el remitente toma tu cuenta actual cuando existe.
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {(["recipient", "sender", "system"] as EmailVariableCategory[]).map((category) => (
            <section key={category} className="space-y-3 pb-5 last:pb-0">
              <h3 className="text-sm font-semibold">{categoryTitles[category]}</h3>
              <div className="space-y-2">
                {grouped[category].map((variable) => (
                  <div key={variable.key} className="rounded-2xl border bg-muted/20 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-background px-2 py-1 text-sm font-medium">{`{{${variable.key}}}`}</code>
                          <span className="text-sm font-medium">{variable.label}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{variable.description}</p>
                        {variable.aliases?.length ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Alias: {variable.aliases.map((alias) => `{{${alias}}}`).join(", ")}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Ejemplo: <span className="font-medium text-foreground">{variable.exampleValue || "vacío"}</span>
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => copyToken(variable.key)}>
                        {copied === variable.key ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                        Copiar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
