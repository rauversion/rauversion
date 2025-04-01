import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useForm, Controller } from "react-hook-form"
import { post, destroy } from "@rails/request.js"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PLAYLIST_TYPES = [
  "playlist",
  "album",
  "ep",
  "single",
  "compilation"
]

export default function AddToPlaylist({ track, open, onOpenChange }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("add-to-playlist")
  const { toast } = useToast()

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      title: "",
      description: "",
      playlist_type: "playlist"
    }
  })

  useEffect(() => {
    const fetchPlaylists = async () => {
      if(!open) return
      setLoading(true)
      try {
        const response = await fetch(`/playlists/new.json?track_id=${track.id}`)
        const data = await response.json()
        setPlaylists(data.playlists)
      } catch (error) {
        console.error("Error fetching playlists:", error)
      }
      setLoading(false)
    }

    fetchPlaylists()
  }, [track, open])

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const response = await post(`/track_playlists.json`, {
        body: JSON.stringify({
          track_playlist: {
            track_id: track.id,
            playlist_id: playlistId
          }
        })
      })

      if (response.ok) {
        const data = await response.json
        
        // Update the playlists state to reflect the change
        setPlaylists(playlists.map(p => 
          p.id === playlistId 
            ? { ...p, has_track: data.added }
            : p
        ))

        toast({
          title: "Success",
          description: data.message,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromPlaylist = async (playlistId) => {
    try {
      const response = await destroy(`/track_playlists/${playlistId}.json`, {
        body: JSON.stringify({
          track_playlist: {
            track_id: track.id,
            playlist_id: playlistId
          }
        })
      })

      if (response.ok) {
        const data = await response.json
        
        // Update the playlists state to reflect the change
        setPlaylists(playlists.map(p => 
          p.id === playlistId 
            ? { ...p, has_track: data.added }
            : p
        ))

        toast({
          title: "Success",
          description: data.message,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove track from playlist",
        variant: "destructive",
      })
    }
  }

  const handlePlaylistAction = (playlist) => {
    if (playlist.has_track) {
      handleRemoveFromPlaylist(playlist.id)
    } else {
      handleAddToPlaylist(playlist.id)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await post("/playlists.json", {
        body: JSON.stringify({
          playlist: {
            ...data,
            track_ids: [track.id]
          }
        })
      })

      if (response.ok) {
        reset()
        setActiveTab("add-to-playlist")
        // Refresh playlists list
        // fetchPlaylists()
        onOpenChange(false)
        
        toast({
          title: "Success",
          description: "Playlist created successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 px-6">
            <TabsTrigger value="add-to-playlist">Add to Playlist</TabsTrigger>
            <TabsTrigger value="create-playlist">Create New Playlist</TabsTrigger>
          </TabsList>

          <TabsContent value="add-to-playlist" className="flex-1 data-[state=inactive]:hidden">
            {loading ? (
              <div className="p-6">Loading playlists...</div>
            ) : (
              <div className="flex-1 p-6">
                <div className="space-y-4 h-[calc(80vh-233px)] overflow-y-auto">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{playlist.title}</h3>
                        <p className="text-sm text-gray-500">{playlist.track_count} tracks</p>
                      </div>
                      <Button 
                        onClick={() => handlePlaylistAction(playlist)}
                        variant={playlist.has_track ? "secondary" : "default"}
                      >
                        {playlist.has_track ? "Remove Track" : "Add Track"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create-playlist" className="flex-1 data-[state=inactive]:hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Controller
                      name="title"
                      control={control}
                      rules={{ required: "Title is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input {...field} id="title" placeholder="Playlist title" />
                          {error && (
                            <p className="text-sm text-destructive">{error.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playlist_type">Type</Label>
                    <Controller
                      name="playlist_type"
                      control={control}
                      rules={{ required: "Type is required" }}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PLAYLIST_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          id="description"
                          placeholder="Describe your playlist..."
                          className="resize-none"
                          rows={4}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t p-4 mt-auto">
                <Button type="submit" className="w-full">
                  Create Playlist
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
