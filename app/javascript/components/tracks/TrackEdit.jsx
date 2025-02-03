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

                <TabsContent value="metadata" className="px-6 space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>License</Label>
                      <Controller
                        name="copyright"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all-rights" id="all-rights" />
                              <Label htmlFor="all-rights">All rights reserved</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="common" id="common" />
                              <Label htmlFor="common">Creative commons</Label>
                            </div>
                          </RadioGroup>
                        )}
                      />
                    </div>

                    {watchCopyright === "common" && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="attribution"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                {...field}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="attribution" className="text-sm">
                            Allow others to copy, distribute, display and perform your copyrighted work but only if they give credit the way you request.
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Controller
                            name="noncommercial"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                {...field}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="noncommercial" className="text-sm">
                            Allow others to distribute, display and perform your work—and derivative works based upon it—but for noncommercial purposes only.
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label>Usage Rights</Label>
                          <Controller
                            name="copies"
                            control={control}
                            render={({ field }) => (
                              <RadioGroup
                                {...field}
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="non_derivative_works" id="non_derivative_works" />
                                  <div className="space-y-1">
                                    <Label htmlFor="non_derivative_works">Non derivative works</Label>
                                    <p className="text-sm text-gray-500">
                                      Allow others to copy, distribute, display and perform only verbatim copies of your work, not derivative works based upon it.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="share_alike" id="share_alike" />
                                  <div className="space-y-1">
                                    <Label htmlFor="share_alike">Share Alike</Label>
                                    <p className="text-sm text-gray-500">
                                      Allow others to distribute derivative works only under a license identical to the license that governs your work.
                                    </p>
                                  </div>
                                </div>
                              </RadioGroup>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="genre" className="text-right">Genre</Label>
                      <Controller
                        name="genre"
                        control={control}
                        render={({ field }) => (
                          <BaseSelect
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {Category.Genres.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </BaseSelect>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contains_music" className="text-right">Contains Music</Label>
                      <Controller
                        name="contains_music"
                        control={control}
                        render={({ field }) => (
                          <BaseSelect
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </BaseSelect>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artist" className="text-right">Artist</Label>
                      <Controller
                        name="artist"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="publisher" className="text-right">Publisher</Label>
                      <Controller
                        name="publisher"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isrc" className="text-right">ISRC</Label>
                      <Controller
                        name="isrc"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="composer" className="text-right">Composer</Label>
                      <Controller
                        name="composer"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="release_title" className="text-right">Release Title</Label>
                      <Controller
                        name="release_title"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buy_link" className="text-right">Buy Link</Label>
                      <Controller
                        name="buy_link"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="album_title" className="text-right">Album Title</Label>
                      <Controller
                        name="album_title"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="record_label" className="text-right">Record Label</Label>
                      <Controller
                        name="record_label"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="col-span-3"
                          />
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="px-6 space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <Label htmlFor="price">Price</Label>
                      <div className="mt-2">
                        <Controller
                          name="price"
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        $0 or more. We take a %3 commission when price is above $0. Fee will be capped to total payment amount
                      </p>
                    </div>

                    <div className="sm:col-span-4 flex items-center">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="name_your_price"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              {...field}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <div>
                          <Label htmlFor="name_your_price">Let fans pay more if they want</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="px-6 space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    {permissionDefinitions.map((permission) => (
                      <div key={permission.name} className={permission.wrapperClass}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Controller
                              name={permission.name}
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  {...field}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              )}
                            />
                            <Label 
                              htmlFor={permission.name} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Label>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 ml-6">
                          {watchPermissions[permission.name] ? permission.checkedHint : permission.uncheckedHint}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="share" className="px-6 space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Share Link Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Link2 className="h-5 w-5" />
                          Share Link
                        </CardTitle>
                        <CardDescription>
                          Share your track directly using this link
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Input
                            readOnly
                            value={`${window.location.origin}/${track.user.username}/${track.slug}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault(); handleCopy('link', `${window.location.origin}/${track.user.username}/${track.slug}`)
                            }}
                            className="shrink-0"
                          >
                            {copiedStates.link ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Social Share Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Share on Social Media</CardTitle>
                        <CardDescription>
                          Share your track on your favorite social platform
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-4">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={(e) =>{
                               e.preventDefault(); handleSocialShare('twitter')}
                            }
                          >
                            <Twitter className="mr-2 h-4 w-4" />
                            Twitter
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                               e.preventDefault(); handleSocialShare('facebook')}
                            }
                          >
                            <Facebook className="mr-2 h-4 w-4" />
                            Facebook
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Embed Code Card */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Code2 className="h-5 w-5" />
                          Embed
                        </CardTitle>
                        <CardDescription>
                          Add this track to your website by copying the embed code
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="relative">
                            <Textarea
                              readOnly
                              value={getEmbedCode()}
                              className="min-h-[100px] font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault(); handleCopy('embed', getEmbedCode())
                              }}
                              className="absolute top-2 right-2"
                            >
                              {copiedStates.embed ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="rounded-lg border bg-muted p-4">
                            <div className="text-sm text-muted-foreground">
                              Preview
                            </div>
                            <div className="mt-2" dangerouslySetInnerHTML={{ __html: getEmbedCode() }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
