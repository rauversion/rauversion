import React, { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Category } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { put } from "@rails/request.js"
import { Check, Copy, Facebook, Twitter, Link2, Code2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const permissionDefinitions = [
  {
    name: "direct_download",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track will be available for direct download in the original format it was uploaded.",
    uncheckedHint: "This track will not be available for direct download in the original format it was uploaded."
  },
  {
    name: "display_embed",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track's embedded-player code will be displayed publicly.",
    uncheckedHint: "This track's embedded-player code will only be displayed to you."
  },
  {
    name: "enable_comments",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "Enable comments",
    uncheckedHint: "Comments disabled."
  },
  {
    name: "display_comments",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "Display comments",
    uncheckedHint: "Don't display public comments."
  },
  {
    name: "display_stats",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "Display public stats",
    uncheckedHint: "Don't display public stats."
  },
  {
    name: "include_in_rss",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track will be included in your RSS feed if it is public.",
    uncheckedHint: "This track will not be included in your RSS feed."
  },
  {
    name: "offline_listening",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track can be played on devices without an internet connection.",
    uncheckedHint: "Playing this track will not be possible on devices without an internet connection."
  },
  {
    name: "enable_app_playblack",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track will be playable outside of Rauversion and its apps.",
    uncheckedHint: "This track will not be playable outside of Rauversion and its apps."
  }
]

export default function TrackEdit({ track, open, onOpenChange }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
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
  })

  const [copiedStates, setCopiedStates] = useState({
    link: false,
    embed: false
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await put(`/tracks/${track.slug}`, {
        body: JSON.stringify({ track: formData }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Track</DialogTitle>
          <DialogDescription>
            Make changes to your track here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <Tabs defaultValue="basic-info" className="flex flex-col h-full">
            <div className="px-6">
              <TabsList>
                <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <TabsContent value="basic-info" className="space-y-6 pb-6">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Privacy</Label>
                    <RadioGroup
                      name="private"
                      value={formData.private?.toString()}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, private: value === "true" }))
                      }
                      className="col-span-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="public" />
                        <Label htmlFor="public">Public</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="private" />
                        <Label htmlFor="private">Private</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Podcast</Label>
                    <div className="col-span-3">
                      <Switch
                        checked={formData.podcast}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, podcast: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-6 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>License</Label>
                    <RadioGroup
                      name="copyright"
                      value={formData.copyright}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, copyright: value }))
                      }
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
                  </div>

                  {formData.copyright === "common" && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="attribution"
                          checked={formData.attribution}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, attribution: checked }))
                          }
                        />
                        <Label htmlFor="attribution" className="text-sm">
                          Allow others to copy, distribute, display and perform your copyrighted work but only if they give credit the way you request.
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="noncommercial"
                          checked={formData.noncommercial}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, noncommercial: checked }))
                          }
                        />
                        <Label htmlFor="noncommercial" className="text-sm">
                          Allow others to distribute, display and perform your work—and derivative works based upon it—but for noncommercial purposes only.
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Usage Rights</Label>
                        <RadioGroup
                          name="copies"
                          value={formData.copies}
                          onValueChange={(value) => 
                            setFormData(prev => ({ ...prev, copies: value }))
                          }
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
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-right">Genre</Label>
                    <Select
                      name="genre"
                      value={formData.genre}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, genre: value }))
                      }
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
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contains_music" className="text-right">Contains Music</Label>
                    <Select
                      name="contains_music"
                      value={formData.contains_music}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, contains_music: value }))
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artist" className="text-right">Artist</Label>
                    <Input
                      id="artist"
                      name="artist"
                      value={formData.artist}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publisher" className="text-right">Publisher</Label>
                    <Input
                      id="publisher"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isrc" className="text-right">ISRC</Label>
                    <Input
                      id="isrc"
                      name="isrc"
                      value={formData.isrc}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="composer" className="text-right">Composer</Label>
                    <Input
                      id="composer"
                      name="composer"
                      value={formData.composer}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="release_title" className="text-right">Release Title</Label>
                    <Input
                      id="release_title"
                      name="release_title"
                      value={formData.release_title}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_link" className="text-right">Buy Link</Label>
                    <Input
                      id="buy_link"
                      name="buy_link"
                      value={formData.buy_link}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="album_title" className="text-right">Album Title</Label>
                    <Input
                      id="album_title"
                      name="album_title"
                      value={formData.album_title}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="record_label" className="text-right">Record Label</Label>
                    <Input
                      id="record_label"
                      name="record_label"
                      value={formData.record_label}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 pb-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                  {permissionDefinitions.map((permission) => (
                    <div key={permission.name} className={permission.wrapperClass}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.name}
                            checked={formData[permission.name]}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({ ...prev, [permission.name]: checked }))
                            }
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
                        {formData[permission.name] ? permission.checkedHint : permission.uncheckedHint}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="share" className="space-y-6 pb-6">
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

            <div className="border-t p-6 mt-auto">
              <Button type="submit" className="w-full">
                Save changes
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  )
}
