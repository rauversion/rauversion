"use client"

import React from "react"
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendEmailTest } from "@/lib/email-editor/api"
import { normalizeEmailDocument } from "@/lib/email-editor/normalizers"
import { serializeEmailDocumentToMjml } from "@/lib/email-editor/serializer"
import type { EmailDocument } from "@/lib/email-editor/types"
import { cn } from "@/lib/utils"

type DeliveryStatus = "idle" | "processing" | "sent" | "error"

interface EmailTestSendDialogProps {
  document: EmailDocument
}

export function EmailTestSendDialog({ document }: EmailTestSendDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [toEmail, setToEmail] = React.useState("")
  const [status, setStatus] = React.useState<DeliveryStatus>("idle")
  const [message, setMessage] = React.useState("")
  const [warnings, setWarnings] = React.useState<string[]>([])

  React.useEffect(() => {
    if (open) return

    setStatus("idle")
    setMessage("")
    setWarnings([])
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setStatus("processing")
    setMessage("")
    setWarnings([])

    try {
      const normalized = normalizeEmailDocument(document, document.name)
      const result = await sendEmailTest({
        toEmail: toEmail.trim(),
        subject: normalized.subject,
        templateName: normalized.name,
        mjml: serializeEmailDocumentToMjml(normalized),
      })

      setStatus("sent")
      setMessage(result.message)
      setWarnings(result.warnings)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el correo de prueba")
      setWarnings([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Send className="mr-1 h-4 w-4" />
          Enviar test
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar correo de prueba</DialogTitle>
          <DialogDescription>
            Se enviará el HTML compilado del estado actual del editor a la casilla que indiques.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Subject</p>
            <p className="text-sm font-medium">{document.subject || "Email de prueba"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-test-recipient">Correo destino</Label>
            <Input
              id="email-test-recipient"
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={toEmail}
              onChange={(event) => setToEmail(event.target.value)}
              disabled={status === "processing"}
            />
          </div>

          {status !== "idle" ? (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                status === "processing" && "border-sky-200 bg-sky-50 text-sky-900",
                status === "sent" && "border-emerald-200 bg-emerald-50 text-emerald-900",
                status === "error" && "border-rose-200 bg-rose-50 text-rose-900"
              )}
            >
              <div className="flex items-start gap-2">
                {status === "processing" ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin" /> : null}
                {status === "sent" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : null}
                {status === "error" ? <AlertCircle className="mt-0.5 h-4 w-4" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {status === "processing" ? "Enviando..." : status === "sent" ? "Enviado" : "Error"}
                  </p>
                  {message ? <p className="mt-1 whitespace-pre-wrap">{message}</p> : null}
                  {warnings.length > 0 ? (
                    <ul className="mt-2 list-disc pl-5">
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={status === "processing"}>
              Cerrar
            </Button>
            <Button type="submit" disabled={status === "processing"}>
              {status === "processing" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
