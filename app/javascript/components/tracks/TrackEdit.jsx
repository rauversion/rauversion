import React, { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Select as BaseSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Category, permissionDefinitions } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useThemeStore } from '@/stores/theme'
import { put, destroy } from "@rails/request.js"
import { Check, Copy, Facebook, Twitter, Link2, Code2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/ui/image-uploader"
import Select from "react-select"
import selectTheme from "@/components/ui/selectTheme"
import { useNavigate } from "react-router-dom"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import MetadataForm from "@/components/shared/forms/MetadataForm"
import PermissionsForm from "@/components/shared/forms/PermissionsForm"
import ShareForm from "@/components/shared/forms/ShareForm"
import PricingForm from "@/components/shared/forms/PricingForm"
import I18n from 'stores/locales'

export default function TrackEdit({ track: initialTrack, open, onOpenChange, onOk }) {
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const navigate = useNavigate()
  const [track, setTrack] = useState(initialTrack)
  const [loading, setLoading] = useState(false)
  const [cropUploadMode, setCropUploadMode] = useState("original_with_coords") // "crop" or "original_with_coords"

  const { control, handleSubmit, setValue, watch, form } = useForm({
    defaultValues: {
      title: track.title || "",
      description: track.description || "",
      private: track.private || false,
      podcast: track.podcast || false,
      genre: track.genre || "",
      contains_music: track.contains_music || "",
      artist: track.artist || "",
      publisher: track.publisher || "",
      isrc: track.isrc || "",
      composer: track.composer || "",
      release_title: track.release_title || "",
      buy_link: track.buy_link || "",
      album_title: track.album_title || "",
      record_label: track.record_label || "",
      copyright: track.copyright || "all-rights",
      attribution: track.attribution || false,
      noncommercial: track.noncommercial || false,
      copies: track.copies || "non_derivative_works",
      direct_download: track.direct_download || false,
      display_embed: track.display_embed || false,
      enable_comments: track.enable_comments || false,
      display_comments: track.display_comments || false,
      display_stats: track.display_stats || false,
      include_in_rss: track.include_in_rss || false,
      offline_listening: track.offline_listening || false,
      enable_app_playblack: track.enable_app_playblack || false,
      price: track.price || "0",
      name_your_price: track.name_your_price || false,
      tags: track.tags || [],
      cover: track.cover || "",
    }
  })

  const fetchTrack = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/tracks/${track.slug}.json`)
      const data = await response.json()
      setTrack(data.track)
      setValue('cropped_image', data.cover_url?.cropped_image)

      // Update form values with fetched data
      Object.entries(data.track).forEach(([key, value]) => {
        if (key === "metadata") {
          Object.entries(value).forEach(([metaKey, metaValue]) => {
            if (metaKey === "peaks") {
              setValue(metaKey, metaValue)
            }
          })
        } else {
          setValue(key, value)
        }
      })
    } catch (error) {
      console.error("Error fetching track:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    fetchTrack()
  }, [open])

  const handleCoverUpload = async (signedBlobId, cropData, serviceUrl) => {
    if (signedBlobId) {
      setValue('cover', signedBlobId)
    }
    if (cropData) setValue('crop_data', cropData)
    if (serviceUrl) {
      setValue('cover_service_url', serviceUrl)
      setValue('cropped_image', serviceUrl)
    }

    toast({
      description: I18n.t('tracks.edit.messages.cover_success'),
    })
  }

  const onSubmit = async (data) => {
    try {
      const payload = { ...data }
      if (!payload.cover) {
        delete payload.cover
      }

      const response = await put(`/tracks/${track.slug}`, {
        body: JSON.stringify({ track: payload }),
        responseKind: "json"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: I18n.t('tracks.edit.messages.update_success')
        })
        onOpenChange(false)
        onOk && onOk(response)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || I18n.t('tracks.edit.messages.update_error'),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('tracks.edit.messages.update_error'),
        variant: "destructive"
      })
    }
  }

  const handleTagsChange = (selectedOptions) => {
    setValue('tags', selectedOptions ? selectedOptions.map(option => option.value) : [])
  }

  const handleDelete = async () => {
    try {
      const response = await destroy(`/tracks/${track.slug}`, {
        responseKind: "json"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: I18n.t('tracks.edit.messages.delete_success')
        })
        onOpenChange(false)
        navigate('/')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || I18n.t('tracks.edit.messages.delete_error'),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('tracks.edit.messages.delete_error'),
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{I18n.t('tracks.edit.dialog.loading')}</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{I18n.t('tracks.edit.dialog.title')}</DialogTitle>
          <DialogDescription>
            {I18n.t('tracks.edit.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="border-b px-6">
            <Tabs defaultValue="basic-info" className="h-full">
              <TabsList>
                <TabsTrigger value="basic-info">{I18n.t('tracks.edit.tabs.basic_info')}</TabsTrigger>
                <TabsTrigger value="metadata">{I18n.t('tracks.edit.tabs.metadata')}</TabsTrigger>
                <TabsTrigger value="pricing">{I18n.t('tracks.edit.tabs.pricing')}</TabsTrigger>
                <TabsTrigger value="permissions">{I18n.t('tracks.edit.tabs.permissions')}</TabsTrigger>
                <TabsTrigger value="share">{I18n.t('tracks.edit.tabs.share')}</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto" style={{ height: 'calc(70vh - 180px)' }}>
                <TabsContent value="basic-info" className="px-6 space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                      <Label>{I18n.t('tracks.edit.form.cover')}</Label>
                      <div className="mt-2 aspect-square">

                        <ImageUploader
                          onUploadComplete={handleCoverUpload}
                          aspectRatio={1}
                          maxSize={10}
                          imageUrl={watch('cover_service_url') || track.cover_url.original}
                          imageCropped={watch('cropped_image') || track.cover_url.cropped_image}
                          preview={true}
                          initialCropData={watch('crop_data')}
                          enableCropper={true}
                          cropUploadMode={cropUploadMode}
                          className=""
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 space-y-6">
                      <div>
                        <Label htmlFor="title">{I18n.t('tracks.edit.form.title')}</Label>
                        <Controller
                          name="title"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className="mt-2"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <Label htmlFor="tags">{I18n.t('tracks.edit.form.tags')}</Label>
                        <Controller
                          name="tags"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              isMulti
                              className="mt-2"
                              theme={(theme) => selectTheme(theme, isDarkMode)}
                              options={Category.Genres.map(genre => ({
                                value: genre.toLowerCase(),
                                label: genre
                              }))}
                              value={field.value.map(tag => ({
                                value: tag,
                                label: tag.charAt(0).toUpperCase() + tag.slice(1)
                              }))}
                              onChange={handleTagsChange}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">{I18n.t('tracks.edit.form.description')}</Label>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              className="mt-2"
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name="private"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              {...field}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label htmlFor="private">{I18n.t('tracks.edit.form.private')}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Controller
                          name="podcast"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              {...field}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label htmlFor="podcast">{I18n.t('tracks.edit.form.podcast')}</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="p-6">
                  <MetadataForm control={control} />
                </TabsContent>

                <TabsContent value="pricing" className="p-6">
                  <PricingForm control={control} form={form} />
                </TabsContent>

                <TabsContent value="permissions" className="p-6">
                  <PermissionsForm control={control} watch={watch} />
                </TabsContent>

                <TabsContent value="share" className="p-6">
                  <ShareForm item={{ type: "track", slug: track.slug, user: { username: track.user.username } }} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="border-t p-6 mt-auto">
            <div className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    {I18n.t('tracks.edit.delete.button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{I18n.t('tracks.edit.delete.confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {I18n.t('tracks.edit.delete.confirm_description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{I18n.t('tracks.edit.delete.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {I18n.t('tracks.edit.delete.button')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit">
                {I18n.t('tracks.edit.dialog.save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
