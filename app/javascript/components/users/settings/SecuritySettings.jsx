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
          description: "Your password has been updated.",
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your password.",
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
            Security Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm New Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              {...register("password_confirmation", {
                required: "Please confirm your password",
                validate: value =>
                  value === password || "The passwords do not match",
              })}
            />
            {errors.password_confirmation && (
              <p className="text-sm text-destructive">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">Update password</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
