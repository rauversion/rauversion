import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { get, post, put } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { useThemeStore } from '@/stores/theme'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploader } from "@/components/ui/image-uploader"
import Select from "react-select"
import selectTheme from "@/components/ui/selectTheme"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import useAuthStore from "@/stores/authStore"
import { set } from "date-fns/set"

export default function ReleaseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [playlists, setPlaylists] = React.useState([])
  const { currentUser } = useAuthStore()
  const { isDarkMode } = useThemeStore()
  const isEditing = Boolean(id)

  const { register, handleSubmit, reset, control, getValues, setValue } = useForm({
    defaultValues: {
      title: "",
      subtitle: "",
      spotify: "",
      bandcamp: "",
      soundcloud: "",
      cover_color: "#000000",
      record_color: "#000000",
      sleeve_color: "#000000",
      playlist_id: null,
      published: false,
      cover: "",
    },
  })

  React.useEffect(() => {
    const fetchPlaylists = async () => {
      if (!currentUser) return
      try {
        const response = await get(`/${currentUser.username}/all_playlists.json`)
        if (response.ok) {
          const data = await response.json
          setPlaylists(data.collection || [])
        }
      } catch (error) {
        console.error("Error fetching playlists:", error)
        toast({
          title: "Error",
          description: "Could not load playlists",
          variant: "destructive",
        })
      }
    }
    fetchPlaylists()
  }, [currentUser])

  React.useEffect(() => {
    if (isEditing) {
      const fetchRelease = async () => {
        try {
          const response = await get(`/releases/${id}.json`)
          if (response.ok) {
            const data = await response.json
            reset({
              title: data.title,
              subtitle: data.subtitle,
              spotify: data.links.spotify,
              bandcamp: data.links.bandcamp,
              soundcloud: data.links.soundcloud,
              cover_color: data.colors.cover,
              record_color: data.colors.record,
              sleeve_color: data.colors.sleeve,
              playlist_id: data.playlist_id,
              published: !!data.published,
              cover: "",
              cover_url: data.cover_url || "",
            })
          }
        } catch (error) {
          console.error("Error fetching release:", error)
          toast({
            title: "Error",
            description: "Could not load release",
            variant: "destructive",
          })
        }
      }
      fetchRelease()
    }
  }, [id, isEditing, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const formData = {
        ...data,
        playlist_id: data.playlist_id || null
      }

      const response = isEditing
        ? await put(`/releases/${id}`, {
          body: JSON.stringify({ release: formData }),
          responseKind: "json",
        })
        : await post("/releases", {
          body: JSON.stringify({ release: formData }),
          responseKind: "json",
        })

      if (response.ok) {
        const data = await response.json
        toast({
          description: `Release ${isEditing ? "updated" : "created"} successfully`,
        })
        // navigate(data.urls.editor)
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || `Could not ${isEditing ? "update" : "create"} release`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving release:", error)
      toast({
        title: "Error",
        description: `Could not ${isEditing ? "update" : "create"} release`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Release" : "New Release"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update your release details"
              : "Create a new release and add your tracks"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" {...register("subtitle")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spotify">Spotify URL</Label>
                <Input id="spotify" {...register("spotify")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bandcamp">Bandcamp URL</Label>
                <Input id="bandcamp" {...register("bandcamp")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soundcloud">Soundcloud URL</Label>
                <Input id="soundcloud" {...register("soundcloud")} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cover_color">Cover Color</Label>
                <Input
                  id="cover_color"
                  type="color"
                  {...register("cover_color")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="record_color">Record Color</Label>
                <Input
                  id="record_color"
                  type="color"
                  {...register("record_color")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleeve_color">Sleeve Color</Label>
                <Input
                  id="sleeve_color"
                  type="color"
                  {...register("sleeve_color")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playlist_id">Playlists</Label>
              <Controller
                name="playlist_id"
                control={control}
                render={({ field }) => {
                  console.log("field", field.value)
                  return <Select
                    {...field}
                    options={
                      playlists.map((playlist) => ({
                        value: playlist.id,
                        label: playlist.title
                      }))
                    }
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value || null);
                    }}
                    value={field.value ? {
                      value: field.value,
                      label: playlists.find(p => p.id === field.value)?.title
                    } : null}
                    theme={(theme) => selectTheme(theme, isDarkMode)}
                    placeholder="Select playlists"
                  />
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="published">
                <input
                  id="published"
                  type="checkbox"
                  {...register("published")}
                  className="mr-2"
                />
                Published
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image</Label>
              <ImageUploader
                value={getValues("cover")}
                previewImage={getValues("cover_url") || getValues("cover")}
                onUploadComplete={url => {
                  setValue("cover", url)
                  setValue("cover_url", url)
                }}
              />
              {(getValues("cover_url") || getValues("cover")) && (
                <img
                  src={getValues("cover_url") || getValues("cover")}
                  alt="Cover"
                  className="mt-2 rounded w-full max-w-xs"
                />
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/releases")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update" : "Create"} Release</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
