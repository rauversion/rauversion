import React from "react"
import { useNavigate } from "react-router-dom"
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

export default function PlaylistEdit({ playlist, open, onOpenChange }) {
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const navigate = useNavigate()
  
  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      title: playlist.title || "",
      description: playlist.description || "",
      private: playlist.private || false,
      enable_label: playlist.enable_label || false,
      playlist_type: playlist.playlist_type || "",
      release_date: playlist.release_date || "",
      price: playlist.price || "0",
      name_your_price: playlist.name_your_price || false,
      buy_link: playlist.buy_link || "",
      buy_link_title: playlist.buy_link_title || "",
      record_label: playlist.record_label || "",
      cover: playlist.cover || "",
      attribution: playlist.attribution || false,
      noncommercial: playlist.noncommercial || false,
      copies: playlist.copies || "non_derivative_works",
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
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
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

              <TabsContent value="pricing" className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Price</Label>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                        />
                      )}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      $0 or more. We apply a fee when price is higher than $0.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="name_your_price"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label>Let fans pay more if they want</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Buy Link</Label>
                    <Controller
                      name="buy_link"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Buy Link Title</Label>
                    <Controller
                      name="buy_link_title"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Record Label</Label>
                    <Controller
                      name="record_label"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} />
                      )}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Attribution Settings</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="attribution"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label>Attribution</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="noncommercial"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label>Non-Commercial</Label>
                    </div>

                    <div>
                      <Label>Copies</Label>
                      <Controller
                        name="copies"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={[
                              { value: "non_derivative_works", label: "Non Derivative Works" },
                              { value: "share_alike", label: "Share Alike" },
                            ]}
                            theme={(theme) => selectTheme(theme, isDarkMode)}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
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
