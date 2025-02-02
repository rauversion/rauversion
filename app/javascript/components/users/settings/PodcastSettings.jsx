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
import { ImageUploader } from "@/components/ui/image-uploader"

export default function PodcastSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)
  const [avatarBlobId, setAvatarBlobId] = React.useState(null)

  const defaultValues = {
    podcaster_info_attributes: {
      id: null,
      title: "",
      about: "",
      description: "",
      active: false,
      spotify_url: "",
      apple_podcasts_url: "",
      google_podcasts_url: "",
      stitcher_url: "",
      overcast_url: "",
      pocket_casts_url: "",
    }
  }

  const { register, control, handleSubmit, reset, getValues } = useForm({
    defaultValues
  })

  const fetchUser = async () => {
    try {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        setUser(data.user)
        
        const podcasterInfo = data.user.podcaster_info || {}
        const podcastLinks = podcasterInfo.podcast_links || {}
        
        console.log("Fetched podcaster info:", {
          podcasterInfo,
          avatarUrl: podcasterInfo.avatar_url
        })
        
        reset({
          podcaster_info_attributes: {
            id: podcasterInfo.id || "",
            title: podcasterInfo.title || "",
            about: podcasterInfo.about || "",
            description: podcasterInfo.description || "",
            active: Boolean(podcasterInfo.active),
            spotify_url: podcastLinks.spotify_url || "",
            apple_podcasts_url: podcastLinks.apple_podcasts_url || "",
            google_podcasts_url: podcastLinks.google_podcasts_url || "",
            stitcher_url: podcastLinks.stitcher_url || "",
            overcast_url: podcastLinks.overcast_url || "",
            pocket_casts_url: podcastLinks.pocket_casts_url || "",
          }
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      toast({
        title: "Error",
        description: "Could not load podcast settings.",
        variant: "destructive",
      })
    }
  }

  React.useEffect(() => {
    fetchUser()
  }, [username])

  const onSubmit = async (data) => {
    try {
      const formData = {
        user: {
          podcaster_info_attributes: {
            ...data.podcaster_info_attributes,
          }
        }
      }

      const response = await patch(`/${username}/settings/podcast`, {
        body: JSON.stringify(formData),
        responseKind: "json"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Podcast settings updated successfully",
        })
        setAvatarBlobId(null)
        fetchUser()
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || "Failed to update podcast settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating podcast settings",
        variant: "destructive",
      })
    }
  }

  const handleAvatarUpload = async (signedBlobId) => {
    setAvatarBlobId(signedBlobId)
    const currentValues = getValues()
    
    await onSubmit({
      podcaster_info_attributes: {
        ...currentValues.podcaster_info_attributes,
        avatar_blob_id: signedBlobId
      }
    })
  }

  if (!user) return null

  const podcasterInfo = user.podcaster_info || {}

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Podcast Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your podcast profile and settings.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Podcast Avatar</Label>
            <ImageUploader
              variant="avatar"
              aspectRatio={1}
              maxSize={10}
              preview={true}
              imageUrl={podcasterInfo?.avatar_url?.medium}
              onUploadComplete={handleAvatarUpload}
              className="w-1/4 mx-auto"
            />
            <p className="text-xs text-muted-foreground text-center">
              Recommended: Square image, at least 400x400px
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="podcaster_info_attributes.active"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label>Active Podcaster Profile</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("podcaster_info_attributes.title")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              {...register("podcaster_info_attributes.about")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("podcaster_info_attributes.description")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Distribution Links</h3>
            
            <div className="space-y-2">
              <Label htmlFor="spotify_url">Spotify URL</Label>
              <Input
                id="spotify_url"
                type="url"
                {...register("podcaster_info_attributes.spotify_url")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apple_podcasts_url">Apple Podcasts URL</Label>
              <Input
                id="apple_podcasts_url"
                type="url"
                {...register("podcaster_info_attributes.apple_podcasts_url")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_podcasts_url">Google Podcasts URL</Label>
              <Input
                id="google_podcasts_url"
                type="url"
                {...register("podcaster_info_attributes.google_podcasts_url")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stitcher_url">Stitcher URL</Label>
              <Input
                id="stitcher_url"
                type="url"
                {...register("podcaster_info_attributes.stitcher_url")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overcast_url">Overcast URL</Label>
              <Input
                id="overcast_url"
                type="url"
                {...register("podcaster_info_attributes.overcast_url")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pocket_casts_url">Pocket Casts URL</Label>
              <Input
                id="pocket_casts_url"
                type="url"
                {...register("podcaster_info_attributes.pocket_casts_url")}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
