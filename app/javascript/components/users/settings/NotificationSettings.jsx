import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useForm, Controller } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"

export default function NotificationSettings() {
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

  const { control, handleSubmit } = useForm({
    defaultValues: {
      email_notifications: user?.email_notifications || false,
      new_follower_notification: user?.new_follower_notification || false,
      new_comment_notification: user?.new_comment_notification || false,
      new_like_notification: user?.new_like_notification || false,
      newsletter_subscription: user?.newsletter_subscription || false,
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/notifications`, {
        body: JSON.stringify({ user: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your notification preferences have been updated.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your notification settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your notification settings.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose what notifications you want to receive.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Controller
                name="email_notifications"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Follower</Label>
                <p className="text-sm text-muted-foreground">
                  When someone follows you
                </p>
              </div>
              <Controller
                name="new_follower_notification"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Comment</Label>
                <p className="text-sm text-muted-foreground">
                  When someone comments on your content
                </p>
              </div>
              <Controller
                name="new_comment_notification"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Like</Label>
                <p className="text-sm text-muted-foreground">
                  When someone likes your content
                </p>
              </div>
              <Controller
                name="new_like_notification"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Receive our newsletter with updates and featured content
                </p>
              </div>
              <Controller
                name="newsletter_subscription"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save preferences</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
