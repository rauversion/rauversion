import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, put } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import I18n from 'stores/locales'

export default function EmailSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      email: "",
    },
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          reset({
            email: data.user.email
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: I18n.t('user_settings.email.messages.load_error'),
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await put(`/${username}/settings/email`, {
        body: JSON.stringify({ user: data }),
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          description: I18n.t('user_settings.email.messages.success'),
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || I18n.t('user_settings.email.messages.error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('user_settings.email.messages.error'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{I18n.t('user_settings.email.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {I18n.t('user_settings.email.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{I18n.t('user_settings.email.form.email.label')}</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: I18n.t('user_settings.email.form.email.required'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: I18n.t('user_settings.email.form.email.invalid')
                }
              })}
              placeholder={I18n.t('user_settings.email.form.email.placeholder')}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {I18n.t('user_settings.email.buttons.updating')}
              </>
            ) : (
              I18n.t('user_settings.email.buttons.update')
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
