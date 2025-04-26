import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useForm, Controller } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { useThemeStore } from '@/stores/theme'
import { put, destroy } from "@rails/request.js"
import I18n from 'stores/locales'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUploader } from "@/components/ui/image-uploader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Select from "react-select"
import selectTheme from "@/components/ui/selectTheme"
import PlaylistTracks from "./PlaylistTracks"
import MetadataForm from "@/components/shared/forms/MetadataForm"
import PermissionsForm from "@/components/shared/forms/PermissionsForm"
import ShareForm from "@/components/shared/forms/ShareForm"
import PricingForm from "@/components/shared/forms/PricingForm"

export default function PlaylistEdit({ playlist: initialPlaylist, open, onOpenChange, onOk }) {
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const navigate = useNavigate()

  const fetchPlaylist = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/playlists/${playlist.slug}/edit.json`)
      const data = await response.json()
      setPlaylist(data.playlist)

      // Update form values with fetched data
      Object.entries(data.playlist).forEach(([key, value]) => {
        if (key === "metadata") {
          Object.entries(value).forEach(([metaKey, metaValue]) => {
            setValue(metaKey, metaValue)
          })
        } else {
          setValue(key, value)
        }
      })
    } catch (error) {
      console.error("Error fetching playlist:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    fetchPlaylist()
  }, [open])

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      title: playlist?.title || "",
      description: playlist?.description || "",
      private: playlist?.private || false,
      genre: playlist?.genre || "",
      custom_genre: playlist?.custom_genre || "",
      playlist_type: playlist?.playlist_type || "",
      release_date: playlist?.release_date || "",
      buy_link: playlist?.metadata?.buy_link || "",
      buy_link_title: playlist?.metadata?.buy_link_title || "",
      buy: playlist?.metadata?.buy || false,
      record_label: playlist?.metadata?.record_label || "",
      cover: playlist?.cover || "",
      tags: playlist?.tags || [],
      crop_data: playlist?.crop_data || null,
    }
  })

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
      title: "Success",
      description: I18n.t('playlists.edit.messages.cover_success')
    })
  }

  const onSubmit = async (data) => {
    try {
      // Remove cover from payload if it's empty
      if (!data.cover) {
        delete data.cover
      }

      const response = await put(`/playlists/${playlist.slug}`, {
        responseKind: "json",
        body: JSON.stringify({
          playlist: data
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: I18n.t('playlists.edit.messages.update_success')
        })
        onOpenChange(false)
        onOk && onOk(response)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || I18n.t('playlists.edit.messages.update_error'),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('playlists.edit.messages.update_error'),
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    try {
      const response = await destroy(`/playlists/${playlist.slug}`, {
        responseKind: "json"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: I18n.t('playlists.edit.messages.delete_success')
        })
        onOpenChange(false)
        navigate('/')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || I18n.t('playlists.edit.messages.delete_error'),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('playlists.edit.messages.delete_error'),
        variant: "destructive"
      })
    }
  }

  const playlistTypes = [
    { value: "album", label: I18n.t('playlists.edit.form.types.album') },
    { value: "single", label: I18n.t('playlists.edit.form.types.single') },
    { value: "ep", label: I18n.t('playlists.edit.form.types.ep') },
    { value: "compilation", label: I18n.t('playlists.edit.form.types.compilation') },
  ]

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{I18n.t('playlists.edit.dialog.loading')}</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{I18n.t('playlists.edit.dialog.title')}</DialogTitle>
          <DialogDescription>
            {I18n.t('playlists.edit.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 border-b">
              <TabsList>
                <TabsTrigger value="basic">{I18n.t('playlists.edit.tabs.basic_info')}</TabsTrigger>
                <TabsTrigger value="tracks">{I18n.t('playlists.edit.tabs.tracks')}</TabsTrigger>
                <TabsTrigger value="metadata">{I18n.t('playlists.edit.tabs.metadata')}</TabsTrigger>
                <TabsTrigger value="permissions">{I18n.t('playlists.edit.tabs.permissions')}</TabsTrigger>
                <TabsTrigger value="share">{I18n.t('playlists.edit.tabs.share')}</TabsTrigger>
                <TabsTrigger value="pricing">{I18n.t('playlists.edit.tabs.pricing')}</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="basic" className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>{I18n.t('playlists.edit.form.title')}</Label>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} />
                      )}
                    />
                  </div>

                  <div>
                    <Label>{I18n.t('playlists.edit.form.description')}</Label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} />
                      )}
                    />
                  </div>

                  <div>
                    <Label>{I18n.t('playlists.edit.form.cover')}</Label>

                    <ImageUploader
                      onUploadComplete={handleCoverUpload}
                      aspectRatio={1}
                      maxSize={10}
                      imageUrl={watch('cover_service_url') || playlist.cover_url.original}
                      imageCropped={watch('cropped_image') || playlist.cover_url.cropped_image}
                      preview={true}
                      initialCropData={watch('crop_data')}
                      enableCropper={true}
                      cropUploadMode={'original_with_coords'}
                      className=""
                    />
                  </div>

                  <div>
                    <Label>{I18n.t('playlists.edit.form.playlist_type')}</Label>
                    <Controller
                      name="playlist_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={playlistTypes.find(opt => opt.value === field.value) || null}
                          onChange={option => field.onChange(option ? option.value : "")}
                          options={playlistTypes}
                          theme={theme => selectTheme(theme, isDarkMode)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>{I18n.t('playlists.edit.form.release_date')}</Label>
                    <Controller
                      name="release_date"
                      control={control}
                      render={({ field }) => (
                        <Input type="datetime-local" {...field} />
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="private"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label>{I18n.t('playlists.edit.form.private')}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="enable_label"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label>{I18n.t('playlists.edit.form.enable_label')}</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tracks" className="p-6">
                <PlaylistTracks
                  playlist={playlist}
                  onTracksChange={(tracks) => {
                    // Optional: Update local state if needed
                  }}
                />
              </TabsContent>

              <TabsContent value="metadata" className="p-6">
                <MetadataForm control={control} />
              </TabsContent>

              <TabsContent value="permissions" className="p-6">
                <PermissionsForm control={control} watch={watch} />
              </TabsContent>

              <TabsContent value="share" className="p-6">
                <ShareForm item={{ type: "playlist", slug: playlist.slug, user: playlist.user }} />
              </TabsContent>

              <TabsContent value="pricing" className="p-6">
                <PricingForm control={control} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="border-t p-6 mt-auto">
            <div className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    {I18n.t('playlists.edit.delete.button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{I18n.t('playlists.edit.delete.confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {I18n.t('playlists.edit.delete.confirm_description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{I18n.t('playlists.edit.delete.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {I18n.t('playlists.edit.delete.button')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit">
                {I18n.t('playlists.edit.dialog.save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
