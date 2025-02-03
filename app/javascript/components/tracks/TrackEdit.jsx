import React, { useState } from "react"
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

export default function TrackEdit({ track, open, onOpenChange }) {
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const navigate = useNavigate()
  
  const { control, handleSubmit, setValue, watch } = useForm({
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

  const [copiedStates, setCopiedStates] = useState({
    link: false,
    embed: false
  })

  const watchCopyright = watch('copyright')
  const watchPermissions = permissionDefinitions.reduce((acc, permission) => {
    acc[permission.name] = watch(permission.name)
    return acc
  }, {})

  const handleCoverUpload = async (signedBlobId) => {
    setValue('cover', signedBlobId)
    toast({
      description: "Cover image updated successfully",
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
          description: "Track updated successfully"
        })
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Error updating track",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error updating track",
        variant: "destructive"
      })
    }
  }

  const handleTagsChange = (selectedOptions) => {
    setValue('tags', selectedOptions ? selectedOptions.map(option => option.value) : [])
  }

  const handleCopy = async (type, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [type]: true }))
      toast({
        title: "Copied!",
        description: `${type === 'link' ? 'Link' : 'Embed code'} copied to clipboard`
      })
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }))
      }, 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const handleSocialShare = (platform) => {
    const trackUrl = `${window.location.origin}/${track.user.username}/${track.slug}`
    const text = `Check out "${track.title}" by ${track.user.username}`
    
    let shareUrl
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(trackUrl)}&text=${encodeURIComponent(text)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackUrl)}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const getEmbedCode = () => {
    const trackUrl = `${window.location.origin}/embed/${track.slug}`
    return `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" 
      src="${trackUrl}">
    </iframe>`    
  }

  const handleDelete = async () => {
    try {
      const response = await destroy(`/tracks/${track.slug}`, {
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Track deleted successfully"
        })
        onOpenChange(false)
        navigate('/')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Error deleting track",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error deleting track",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Track</DialogTitle>
          <DialogDescription>
            Make changes to your track here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="border-b px-6">
            <Tabs defaultValue="basic-info" className="h-full">
              <TabsList>
                <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto" style={{ height: 'calc(70vh - 180px)' }}>
                <TabsContent value="basic-info" className="px-6 space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                      <Label>Cover Image</Label>
                      <div className="mt-2 aspect-square">
                        <ImageUploader
                          onUploadComplete={handleCoverUpload}
                          aspectRatio={1}
                          maxSize={10}
                          imageUrl={track.cover_url.medium}
                          preview={true}
                          enableCropper={true}
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 space-y-6">
                      <div>
                        <Label htmlFor="title">Title</Label>
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
                        <Label htmlFor="tags">Tags</Label>
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
                        <Label htmlFor="description">Description</Label>
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
                        <Label htmlFor="private">Private</Label>
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
                        <Label htmlFor="podcast">Podcast</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="p-6">
                  <MetadataForm control={control} />
                </TabsContent>

                <TabsContent value="pricing" className="p-6">
                  <PricingForm control={control} />
                </TabsContent>

                <TabsContent value="permissions" className="p-6">
                  <PermissionsForm control={control} watch={watch} />
                </TabsContent>

                <TabsContent value="share" className="p-6">
                  <ShareForm item={{ type: "track", slug: track.slug }} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="border-t p-6 mt-auto">
            <div className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Delete Track
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your track
                      and remove all associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete Track
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
