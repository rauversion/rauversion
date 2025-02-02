import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"

export default function EmailSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  const defaultValues = {
    new_follower_email: false,
    new_follower_app: false,
    repost_of_your_post_email: false,
    repost_of_your_post_app: false,
    new_post_by_followed_user_email: false,
    new_post_by_followed_user_app: false,
    like_and_plays_on_your_post_app: false,
    comment_on_your_post_email: false,
    comment_on_your_post_app: false,
    suggested_content_email: false,
    suggested_content_app: false,
    new_message_email: false,
    new_message_app: false,
    like_and_plays_on_your_post_email: false,

  }

  const { control, handleSubmit, reset } = useForm({
    defaultValues
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          setUser(data.user)
          
          reset({
            new_follower_email: data.user.new_follower_email || false,
            new_follower_app: data.user.new_follower_app || false,
            repost_of_your_post_email: data.user.repost_of_your_post_email || false,
            repost_of_your_post_app: data.user.repost_of_your_post_app || false,
            new_post_by_followed_user_email: data.user.new_post_by_followed_user_email || false,
            new_post_by_followed_user_app: data.user.new_post_by_followed_user_app || false,
            like_and_plays_on_your_post_app: data.user.like_and_plays_on_your_post_app || false,
            comment_on_your_post_email: data.user.comment_on_your_post_email || false,
            comment_on_your_post_app: data.user.comment_on_your_post_app || false,
            suggested_content_email: data.user.suggested_content_email || false,
            suggested_content_app: data.user.suggested_content_app || false,
            new_message_email: data.user.new_message_email || false,
            new_message_app: data.user.new_message_app || false,
            like_and_plays_on_your_post_email: data.user.like_and_plays_on_your_post_email || false,
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Could not load email settings.",
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username])

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/email`, {
        body: JSON.stringify({ user: data }),
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          description: "Your email settings have been updated.",
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your email settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your email settings.",
        variant: "destructive",
      })
    }
  }

  const handleChange = async (name, value) => {
    const data = {
      ...control._formValues,
      [name]: value
    }
    await onSubmit(data)
  }

  if (!user) return null

  return (
    <form className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email & App Notification Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your email and in-app notification preferences.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Follower</Label>
                <p className="text-sm text-muted-foreground">
                  When someone follows you
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="new_follower_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="new_follower_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reposts</Label>
                <p className="text-sm text-muted-foreground">
                  When someone reposts your content
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="repost_of_your_post_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="repost_of_your_post_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Posts</Label>
                <p className="text-sm text-muted-foreground">
                  When someone you follow posts new content
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="new_post_by_followed_user_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="new_post_by_followed_user_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Likes & Plays</Label>
                <p className="text-sm text-muted-foreground">
                  When someone likes or plays your content
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="like_and_plays_on_your_post_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="like_and_plays_on_your_post_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comments</Label>
                <p className="text-sm text-muted-foreground">
                  When someone comments on your content
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="comment_on_your_post_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="comment_on_your_post_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Suggested Content</Label>
                <p className="text-sm text-muted-foreground">
                  Recommendations based on your interests
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="suggested_content_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="suggested_content_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Messages</Label>
                <p className="text-sm text-muted-foreground">
                  When you receive new messages
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="new_message_email"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="new_message_app"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleChange(field.name, value)
                        }}
                      />
                    )}
                  />
                  <Label>App</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
