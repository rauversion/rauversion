import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Lock } from 'lucide-react'
import I18n from 'stores/locales'

export default function SecuritySettings() {
  const { username } = useParams()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  })

  const password = watch("password")

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/security`, {
        body: JSON.stringify({ user: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: I18n.t('user_settings.security.messages.success'),
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || I18n.t('user_settings.security.messages.error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('user_settings.security.messages.error'),
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {I18n.t('user_settings.security.title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {I18n.t('user_settings.security.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">{I18n.t('user_settings.security.form.password.label')}</Label>
            <Input
              id="password"
              type="password"
              {...register("password", {
                required: I18n.t('user_settings.security.form.password.required'),
                minLength: {
                  value: 8,
                  message: I18n.t('user_settings.security.form.password.min_length'),
                },
              })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">
              {I18n.t('user_settings.security.form.confirm_password.label')}
            </Label>
            <Input
              id="password_confirmation"
              type="password"
              {...register("password_confirmation", {
                required: I18n.t('user_settings.security.form.confirm_password.required'),
                validate: value =>
                  value === password || I18n.t('user_settings.security.form.confirm_password.mismatch'),
              })}
            />
            {errors.password_confirmation && (
              <p className="text-sm text-destructive">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">{I18n.t('user_settings.security.buttons.update')}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
