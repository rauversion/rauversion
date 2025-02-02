import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useForm, Controller } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"

export default function PodcastSettings() {
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

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      podcast_title: user?.podcaster_info?.title || "",
      podcast_description: user?.podcaster_info?.description || "",
      podcast_category: user?.podcaster_info?.category || "",
      podcast_language: user?.podcaster_info?.language || "",
      podcast_explicit: user?.podcaster_info?.explicit || false,
      podcast_website: user?.podcaster_info?.website || "",
      podcast_copyright: user?.podcaster_info?.copyright || "",
      podcast_owner_name: user?.podcaster_info?.owner_name || "",
      podcast_owner_email: user?.podcaster_info?.owner_email || "",
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/podcast`, {
        body: JSON.stringify({ user: { podcaster_info_attributes: data } }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your podcast settings have been updated.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your podcast settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your podcast settings.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Podcast Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your podcast channel settings and information.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="podcast_title">Podcast Title</Label>
            <Input
              id="podcast_title"
              {...register("podcast_title")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="podcast_description">Description</Label>
            <Textarea
              id="podcast_description"
              {...register("podcast_description")}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="podcast_category">Category</Label>
              <Input
                id="podcast_category"
                {...register("podcast_category")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="podcast_language">Language</Label>
              <Input
                id="podcast_language"
                {...register("podcast_language")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Explicit Content</Label>
              <p className="text-sm text-muted-foreground">
                Mark if your podcast contains explicit content
              </p>
            </div>
            <Controller
              name="podcast_explicit"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="podcast_website">Website</Label>
            <Input
              id="podcast_website"
              type="url"
              {...register("podcast_website")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="podcast_copyright">Copyright</Label>
            <Input
              id="podcast_copyright"
              {...register("podcast_copyright")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="podcast_owner_name">Owner Name</Label>
              <Input
                id="podcast_owner_name"
                {...register("podcast_owner_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="podcast_owner_email">Owner Email</Label>
              <Input
                id="podcast_owner_email"
                type="email"
                {...register("podcast_owner_email")}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save podcast settings</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
