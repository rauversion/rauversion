import React from "react"
import { Link, useParams } from "react-router-dom"
import { get, patch } from "@rails/request.js"
import { ExternalLink, RadioTower, Save, Signal } from "lucide-react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import I18n from "@/stores/locales"

function metadataUrl(streamUrl) {
  try {
    return new URL("/status-json.xsl", streamUrl).toString()
  } catch (_error) {
    return null
  }
}

export default function RadioSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [savedUrl, setSavedUrl] = React.useState("")
  const [formError, setFormError] = React.useState(null)
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { radio_stream_url: "" },
  })
  const streamUrl = watch("radio_stream_url")
  const derivedMetadataUrl = metadataUrl(streamUrl)

  React.useEffect(() => {
    const fetchSettings = async () => {
      const response = await get(`/${username}/settings.json`)
      if (!response.ok) return

      const data = await response.json
      const currentUrl = data.user.radio_stream_url || ""
      reset({ radio_stream_url: currentUrl })
      setSavedUrl(currentUrl)
    }

    fetchSettings()
  }, [reset, username])

  const onSubmit = async ({ radio_stream_url }) => {
    setFormError(null)
    const normalizedUrl = radio_stream_url.trim()

    try {
      const response = await patch(`/${username}/settings/radio.json`, {
        body: JSON.stringify({ user: { radio_stream_url: normalizedUrl } }),
        responseKind: "json",
      })
      const payload = await response.json

      if (!response.ok) {
        const errors = payload.errors?.radio_stream_url
        setFormError(Array.isArray(errors) ? errors.join(", ") : I18n.t("user_settings.radio.messages.error"))
        return
      }

      setSavedUrl(payload.user.radio_stream_url || "")
      reset({ radio_stream_url: payload.user.radio_stream_url || "" })
      toast({
        title: I18n.t("user_settings.radio.messages.success_title"),
        description: I18n.t("user_settings.radio.messages.success"),
      })
    } catch (_error) {
      setFormError(I18n.t("user_settings.radio.messages.error"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-black px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-lime-300">RAUVERSION / LIVE SIGNAL</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight">{I18n.t("user_settings.radio.title")}</h2>
            </div>
            <RadioTower className="h-10 w-10 text-lime-300" aria-hidden="true" />
          </div>
        </div>
        <CardHeader>
          <CardTitle>{I18n.t("user_settings.radio.card_title")}</CardTitle>
          <CardDescription>{I18n.t("user_settings.radio.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="radio_stream_url">{I18n.t("user_settings.radio.form.stream_url.label")}</Label>
            <Input
              id="radio_stream_url"
              type="url"
              inputMode="url"
              placeholder="http://radio.example.com:8000/live.mp3"
              aria-invalid={Boolean(formError)}
              {...register("radio_stream_url")}
            />
            <p className="text-sm text-muted-foreground">{I18n.t("user_settings.radio.form.stream_url.help")}</p>
            {formError && <p className="text-sm font-medium text-destructive" role="alert">{formError}</p>}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Signal className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{I18n.t("user_settings.radio.metadata.title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{I18n.t("user_settings.radio.metadata.description")}</p>
                <code className="mt-3 block overflow-x-auto rounded bg-background px-3 py-2 text-xs">
                  {derivedMetadataUrl || "https://your-icecast-host/status-json.xsl"}
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {isSubmitting ? I18n.t("user_settings.radio.buttons.saving") : I18n.t("user_settings.radio.buttons.save")}
            </Button>
            {savedUrl && (
              <Button asChild type="button" variant="outline">
                <Link to={`/${username}/radio`} target="_blank">
                  {I18n.t("user_settings.radio.buttons.view")} <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{I18n.t("user_settings.radio.disable_help")}</p>
    </form>
  )
}
