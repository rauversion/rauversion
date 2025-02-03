import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useForm, Controller } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { useThemeStore } from '@/stores/theme'
import { put, destroy } from "@rails/request.js"

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


export default function PlaylistEdit({ playlist: initialPlaylist, open, onOpenChange }) {
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [loading, setLoading] = useState(false)
  const { slug } = useParams()
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/playlists/${slug}/edit.json`)
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

    fetchPlaylist()
  }, [slug])

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
    }
  })

  const handleCoverUpload = async (signedBlobId) => {
    setValue('cover', signedBlobId)
    toast({
      title: "Success",
      description: "Cover image uploaded successfully"
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
          description: "Playlist updated successfully"
        })
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Error updating playlist",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error updating playlist",
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
          description: "Playlist deleted successfully"
        })
        onOpenChange(false)
        navigate('/')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Error deleting playlist",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error deleting playlist",
        variant: "destructive"
      })
    }
  }

  const playlistTypes = [
    { value: "album", label: "Album" },
    { value: "single", label: "Single" },
    { value: "ep", label: "EP" },
    { value: "compilation", label: "Compilation" },
  ]

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Playlist</DialogTitle>
          <DialogDescription>
            Make changes to your playlist here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 border-b">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="basic" className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Cover Image</Label>
                    <ImageUploader
                      onUpload={handleCoverUpload}
                      preview={playlist.cover_url?.medium}
                    />
                  </div>

                  <div>
                    <Label>Playlist Type</Label>
                    <Controller
                      name="playlist_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={playlistTypes}
                          theme={(theme) => selectTheme(theme, isDarkMode)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Release Date</Label>
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
                    <Label>Private</Label>
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
                    <Label>Enable Label</Label>
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
                    Delete Playlist
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your playlist
                      and remove all associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete Playlist
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
