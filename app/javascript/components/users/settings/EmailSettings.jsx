import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"

export default function EmailSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        setUser(data.user)
      }
    }
    fetchUser()
  }, [username])

  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: user?.email || "",
      current_password: "",
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/email`, {
        body: JSON.stringify({ user: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your email settings have been updated.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your email.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your email.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your email address and preferences.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              {...register("current_password")}
            />
            <p className="text-sm text-muted-foreground">
              We need your current password to confirm your changes
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Update Email</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
