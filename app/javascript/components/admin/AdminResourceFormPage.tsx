import React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { adminGetJson, adminPatchJson, adminPostJson } from "./api"
import type { AdminFieldOption, AdminFormField, AdminListResponse, AdminRecord, AdminRecordResponse, AdminResourceDefinition } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

function buildInitialData(fields: AdminFormField[], source: Record<string, any> = {}) {
  return fields.reduce<Record<string, any>>((memo, field) => {
    if (source[field.key] !== undefined) {
      memo[field.key] = source[field.key]
    } else if (field.type === "boolean") {
      memo[field.key] = false
    } else {
      memo[field.key] = ""
    }
    return memo
  }, {})
}

function normalizeCheckboxValue(value: any) {
  return value === true || value === "true" || value === 1 || value === "1"
}

type AdminResourceFormPageProps = {
  createMode?: boolean
}

export default function AdminResourceFormPage({ createMode = false }: AdminResourceFormPageProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { resourceKey = "", id } = useParams()
  const [resource, setResource] = React.useState<AdminResourceDefinition | null>(null)
  const [record, setRecord] = React.useState<AdminRecord | null>(null)
  const [formData, setFormData] = React.useState<Record<string, any>>({})
  const [errors, setErrors] = React.useState<Record<string, string[]>>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const fetchResource = React.useCallback(async () => {
    try {
      setLoading(true)
      if (createMode) {
        const payload = await adminGetJson<AdminListResponse>(`/api/admin/${resourceKey}?per_page=1`)
        setResource(payload.resource)
        setFormData(buildInitialData(payload.resource.form_fields))
      } else if (id) {
        const payload = await adminGetJson<AdminRecordResponse>(`/api/admin/${resourceKey}/${id}`)
        setResource(payload.resource)
        setRecord(payload.record)
        setFormData(buildInitialData(payload.resource.form_fields, payload.record.form_values || {}))
      }
    } catch (error: any) {
      toast({
        title: "Record load failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [createMode, id, resourceKey, toast])

  React.useEffect(() => {
    fetchResource()
  }, [fetchResource])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      if (createMode) {
        const payload = await adminPostJson<AdminRecordResponse>(`/api/admin/${resourceKey}`, { record: formData })
        toast({ title: "Record created" })
        navigate(`/admin/${resourceKey}/${payload.record.id}`)
        return
      }

      const payload = await adminPatchJson<AdminRecordResponse>(`/api/admin/${resourceKey}/${id}`, { record: formData })
      setRecord(payload.record)
      setFormData(buildInitialData(payload.resource.form_fields, payload.record.form_values || {}))
      toast({ title: "Changes saved" })
    } catch (error: any) {
      setErrors(error?.details || {})
      if (error?.message) {
        toast({
          title: "Save failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const runCustomAction = async (action: any) => {
    if (!action.endpoint) return

    try {
      const payload = await adminPostJson<AdminRecordResponse>(action.endpoint)
      setRecord(payload.record)
      setFormData((current) => ({
        ...current,
        ...(payload.record.form_values || {}),
      }))
      toast({ title: action.label })
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const renderField = (field: AdminFormField) => {
    const value = formData[field.key]
    const disabled = saving || field.readonly

    if (field.type === "textarea") {
      return (
        <Textarea
          id={field.key}
          disabled={disabled}
          value={value ?? ""}
          rows={8}
          onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))}
        />
      )
    }

    if (field.type === "select") {
      return (
        <select
          id={field.key}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value ?? ""}
          onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))}
        >
          <option value="">Select...</option>
          {(field.options || []).map((option: AdminFieldOption) => (
            <option key={`${field.key}-${option.value}`} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === "boolean") {
      return (
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3">
          <input
            type="checkbox"
            checked={normalizeCheckboxValue(value)}
            disabled={disabled}
            onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.checked }))}
          />
          <span className="flex-1 text-sm text-foreground/80">
            <span className="font-medium text-foreground">{field.label}</span>
            {field.description && <span className="mt-1 block text-xs text-muted-foreground">{field.description}</span>}
          </span>
          {field.readonly && <Badge variant="secondary">Read only</Badge>}
        </label>
      )
    }

    return (
      <Input
        id={field.key}
        type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => setFormData((current) => ({ ...current, [field.key]: event.target.value }))}
      />
    )
  }

  if (loading) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading form...</div>
  }

  if (!resource) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Form unavailable.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-3">
            <Link to={`/admin/${resourceKey}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {resource.label}
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {createMode ? `New ${resource.label}` : `Edit ${resource.label}`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
        </div>

        {!createMode && record && (
          <div className="flex flex-wrap gap-2">
            {record.actions
              .filter((action) => action.kind === "custom")
              .map((action) => (
                <Button key={action.key} variant="outline" onClick={() => runCustomAction(action)}>
                  {action.label}
                </Button>
              ))}
          </div>
        )}
      </div>

      <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{createMode ? "Create record" : `Record #${record?.id}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {Object.entries(errors).map(([field, messages]) => (
                <p key={field}>
                  <strong>{field}</strong>: {messages.join(", ")}
                </p>
              ))}
            </div>
          )}

          <form className="space-y-6" onSubmit={submit}>
            {resource.form_fields.map((field, index) => {
              const showSection = field.section && field.section !== resource.form_fields[index - 1]?.section

              return (
                <React.Fragment key={field.key}>
                  {showSection && (
                    <div className={index === 0 ? "pb-1" : "border-t border-border pt-6 pb-1"}>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {field.section}
                      </h2>
                    </div>
                  )}

                  <div className="space-y-2">
                    {field.type !== "boolean" && (
                      <>
                        <label htmlFor={field.key} className="text-sm font-medium text-foreground/80">
                          {field.label}
                          {field.required ? " *" : ""}
                          {field.readonly && <Badge variant="secondary" className="ml-2">Read only</Badge>}
                        </label>
                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                      </>
                    )}
                    {renderField(field)}
                  </div>
                </React.Fragment>
              )
            })}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link to={`/admin/${resourceKey}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : createMode ? "Create" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
