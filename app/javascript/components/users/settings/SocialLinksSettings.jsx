import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import I18n from 'stores/locales'

export default function SocialLinksSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  const defaultValues = {
    social_title: "",
    social_description: "",
    google_analytics_id: "",
    facebook_pixel_id: "",
    email_sign_up: false,
    sensitive_content: false,
    age_restriction: "all",
  }

  const form = useForm({
    defaultValues,
    mode: "onChange"
  })

  const { control, handleSubmit, reset, setError } = form

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          setUser(data.user)
          
          reset({
            social_title: data.user.social_links_settings.social_title || "",
            social_description: data.user.social_links_settings.social_description || "",
            google_analytics_id: data.user.social_links_settings.google_analytics_id || "",
            facebook_pixel_id: data.user.social_links_settings.facebook_pixel_id || "",
            email_sign_up: Boolean(data.user.social_links_settings.email_sign_up),
            sensitive_content: Boolean(data.user.social_links_settings.sensitive_content),
            age_restriction: data.user.social_links_settings.age_restriction || "all",
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: I18n.t('user_settings.social_links.messages.load_error'),
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username])

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/social_links`, {
        body: JSON.stringify({ user: data }),
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          description: I18n.t('user_settings.social_links.messages.success'),
        })
      } else {
        const error = await response.json
        if (error.errors) {
          Object.keys(error.errors).forEach((key) => {
            setError(key, {
              type: "manual",
              message: error.errors[key].join(", ")
            })
          })
          
          toast({
            title: "Error",
            description: I18n.t('user_settings.social_links.messages.form_error'),
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: I18n.t('user_settings.social_links.messages.error'),
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('user_settings.social_links.messages.error'),
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{I18n.t('user_settings.social_links.seo.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {I18n.t('user_settings.social_links.seo.subtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={control}
                name="social_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('user_settings.social_links.seo.form.social_title.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={I18n.t('user_settings.social_links.seo.form.social_title.placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="social_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('user_settings.social_links.seo.form.social_description.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={I18n.t('user_settings.social_links.seo.form.social_description.placeholder')}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{I18n.t('user_settings.social_links.analytics.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {I18n.t('user_settings.social_links.analytics.subtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={control}
                name="google_analytics_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('user_settings.social_links.analytics.form.google.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={I18n.t('user_settings.social_links.analytics.form.google.placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="facebook_pixel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('user_settings.social_links.analytics.form.facebook.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={I18n.t('user_settings.social_links.analytics.form.facebook.placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{I18n.t('user_settings.social_links.mailing.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {I18n.t('user_settings.social_links.mailing.subtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="email_sign_up"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>{I18n.t('user_settings.social_links.mailing.form.email_signup.label')}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {I18n.t('user_settings.social_links.mailing.form.email_signup.description')}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{I18n.t('user_settings.social_links.content.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {I18n.t('user_settings.social_links.content.subtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={control}
              name="sensitive_content"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>{I18n.t('user_settings.social_links.content.form.sensitive.label')}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {I18n.t('user_settings.social_links.content.form.sensitive.description')}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="age_restriction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('user_settings.social_links.content.form.age.label')}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={I18n.t('user_settings.social_links.content.form.age.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{I18n.t('user_settings.social_links.content.form.age.options.all')}</SelectItem>
                        <SelectItem value="13">{I18n.t('user_settings.social_links.content.form.age.options.13')}</SelectItem>
                        <SelectItem value="16">{I18n.t('user_settings.social_links.content.form.age.options.16')}</SelectItem>
                        <SelectItem value="18">{I18n.t('user_settings.social_links.content.form.age.options.18')}</SelectItem>
                        <SelectItem value="21">{I18n.t('user_settings.social_links.content.form.age.options.21')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">{I18n.t('user_settings.social_links.buttons.update')}</Button>
        </div>
      </form>
    </Form>
  )
}
