import React from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
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

export default function ReleaseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [submitError, setSubmitError] = React.useState(null)
  const [playlists, setPlaylists] = React.useState([])
  const { currentUser } = useAuthStore()
  const { isDarkMode } = useThemeStore()
  const isEditing = Boolean(id)
  const playlistIdFromUrl = new URLSearchParams(location.search).get("playlist_id")
  const initialPlaylistId = playlistIdFromUrl ? Number(playlistIdFromUrl) : null

  const { register, handleSubmit, reset, control, getValues, setValue, formState: { errors } } = useForm({
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
          const availablePlaylists = data.collection || []
          setPlaylists(availablePlaylists)

          if (!isEditing && initialPlaylistId) {
            const selectedPlaylist = availablePlaylists.find(
              (playlist) => `${playlist.id}` === `${initialPlaylistId}`
            )

            if (selectedPlaylist) {
              setValue("playlist_id", selectedPlaylist.id)
              setValue("title", selectedPlaylist.title)
            } else {
              // The playlist list is paginated, so load the requested playlist
              // when it is not included on the first page.
              const playlistResponse = await get(`/playlists/${initialPlaylistId}.json`)
              if (playlistResponse.ok) {
                const playlistData = await playlistResponse.json
                const requestedPlaylist = playlistData.playlist

                setPlaylists((currentPlaylists) => [
                  { id: requestedPlaylist.id, title: requestedPlaylist.title },
                  ...currentPlaylists,
                ])
                setValue("playlist_id", requestedPlaylist.id)
                setValue("title", requestedPlaylist.title)
              }
            }
          }
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
  }, [currentUser, initialPlaylistId, isEditing, setValue, toast])

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
    if (loading) return
    setLoading(true)
    setSubmitError(null)
    const fallbackMessage = `Could not ${isEditing ? "update" : "create"} release. Please try again.`
    try {
      // Only send fields that are actually present in the form UI
      const allowedFields = [
        "title",
        "subtitle",
        "spotify",
        "bandcamp",
        "soundcloud",
        "cover_color",
        "record_color",
        "sleeve_color",
        "playlist_id",
        "published",
        "cover"
      ]
      const payload = allowedFields.reduce((acc, key) => {
        const value = data[key]
        if (
          typeof value === "boolean" ||
          typeof value === "number"
        ) {
          acc[key] = value
        } else if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          acc[key] = value
        }
        return acc
      }, {})

      const response = isEditing
        ? await put(`/releases/${id}`, {
          body: JSON.stringify({ release: payload }),
          responseKind: "json",
        })
        : await post("/releases", {
          body: JSON.stringify({ release: payload }),
          responseKind: "json",
        })

      if (!response.ok) {
        let message = fallbackMessage
        try {
          const error = await response.json
          const details = error?.errors || error?.message || error?.error || error
          const messages = typeof details === "string"
            ? [details]
            : Array.isArray(details)
              ? details.filter((value) => typeof value === "string")
              : Object.entries(details || {}).flatMap(([field, values]) =>
                  [values].flat().filter((value) => typeof value === "string").map(
                    (value) => field === "base" ? value : `${field.replaceAll("_", " ")}: ${value}`
                  )
                )
          message = messages.join(". ") || fallbackMessage
        } catch {
          // Non-JSON server errors still leave the form available for retry.
        }
        setSubmitError(message)
        toast({ title: "Error", description: message, variant: "destructive" })
        return
      }

      const savedRelease = await response.json
      toast({
        description: `Release ${isEditing ? "updated" : "created"} successfully`,
      })
      if (!isEditing) navigate(savedRelease.urls.edit, { replace: true })
    } catch (error) {
      console.error("Error saving release:", error)
      setSubmitError(fallbackMessage)
      toast({
        title: "Error",
        description: fallbackMessage,
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
            {submitError && (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p id="title-error" role="alert" className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" {...register("subtitle")} />
            </div>

            {
              /*

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
              
              */
            }


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
                      label: playlists.find(p => `${p.id}` === `${field.value}`)?.title
                    } : null}
                    theme={(theme) => selectTheme(theme, isDarkMode)}
                    placeholder="Select playlists"
                  />
                }}
              />
            </div>

            <div className="space-y-2">
              <Controller
                name="published"
                control={control}
                render={({ field }) => (
                  <Label htmlFor="published">
                    <input
                      id="published"
                      type="checkbox"
                      checked={!!field.value}
                      onChange={e => field.onChange(e.target.checked)}
                      className="mr-2"
                    />
                    Published
                  </Label>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image</Label>
              <ImageUploader
                aspectRatio={1}
                value={getValues("cover")}
                previewImage={getValues("cover_url") || getValues("cover")}

                onUploadComplete={async (signedBlobId, cropData, serviceUrl) => {
                  if (signedBlobId) {
                    setValue("cover", signedBlobId)
                    //form.setValue("thumbnail", signedBlobId)
                  }
                  if (serviceUrl) {
                    // setThumbnailPreview(serviceUrl)
                    setValue("cover_url", serviceUrl)
                  }
                  toast({ description: "image uploaded" })
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
