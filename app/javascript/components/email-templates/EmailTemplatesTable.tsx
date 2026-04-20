import React from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  createEmailTemplate,
  destroyEmailTemplate,
  fetchEmailTemplates,
  type EmailTemplateRecord,
} from "@/lib/email-editor/api"
import { createNewEmailDocument } from "@/lib/email-editor/defaults"

export default function EmailTemplatesTable({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [templates, setTemplates] = React.useState<EmailTemplateRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)

  const loadTemplates = React.useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await fetchEmailTemplates())
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los correos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const document = createNewEmailDocument("Nuevo correo")
      const template = await createEmailTemplate({
        name: document.name,
        subject: document.subject,
        preheader: document.preheader,
        document,
      })
      navigate(`/email-templates/${template.id}/edit`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el correo",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    try {
      await destroyEmailTemplate(templateId)
      setTemplates((current) => current.filter((template) => template.id !== templateId))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el correo",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className={embedded ? "" : "container mx-auto my-8"}>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Emails</h2>
            <p className="text-sm text-muted-foreground">Compón correos MJML y reutilízalos para notificaciones futuras.</p>
          </div>
          <Button type="button" onClick={handleCreate} disabled={creating}>
            {creating ? "Creando..." : "Nuevo correo"}
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Preheader</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="w-[220px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{template.preheader || "—"}</TableCell>
                  <TableCell>{template.updatedAt ? new Date(template.updatedAt).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to={`/email-templates/${template.id}/edit`}>
                        <Button type="button" size="sm" variant="outline">Editar</Button>
                      </Link>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Todavía no tienes correos guardados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
