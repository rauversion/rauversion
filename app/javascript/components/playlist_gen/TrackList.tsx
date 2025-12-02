import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, destroy } from "@rails/request.js"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, FileAudio, Folder, MoreHorizontal, Music, Pause, Play, Disc, ListPlus, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface PlaylistSummary {
  id: number
  name: string
  total_tracks: number
}

interface TrackListProps<T = any> {
  tracks: T[]
  currentTrackId: number | null
  isPlaying: boolean
  onPlayClick: (track: T) => void
  onAddToDeck: (track: T, deck: "A" | "B") => void
  // Mappers para distintos tipos de track
  getId: (track: T) => number
  getTitle: (track: T) => string
  getArtist: (track: T) => string | null | undefined
  getBpm: (track: T) => number | null | undefined
  getKey: (track: T) => string | null | undefined
  getGenre?: (track: T) => string | null | undefined
  getEnergy: (track: T) => number | null | undefined
  getDurationLabel: (track: T) => string
  getFilePath?: (track: T) => string | null | undefined
  showPosition?: boolean
  getPosition?: (track: T) => number | null | undefined
  // Playlist context props
  playlistId?: number
  onTrackRemoved?: () => void
}

const getEnergyColor = (energy: number | null | undefined) => {
  if (energy == null) return "bg-gray-400"
  if (energy <= 3) return "bg-green-500"
  if (energy <= 5) return "bg-yellow-500"
  if (energy <= 7) return "bg-orange-500"
  return "bg-red-500"
}

const getTrackSearchQuery = (title: string, artist?: string | null) => {
  return encodeURIComponent(`${artist || ""} ${title}`.trim())
}

const openFileLocation = (filePath: string | null | undefined) => {
  if (!filePath) return
  const folderPath = filePath.substring(0, filePath.lastIndexOf("/"))
  navigator.clipboard.writeText(folderPath)
}

export function TrackList<T = any>({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayClick,
  onAddToDeck,
  getId,
  getTitle,
  getArtist,
  getBpm,
  getKey,
  getGenre,
  getEnergy,
  getDurationLabel,
  getFilePath,
  showPosition,
  getPosition,
  playlistId,
  onTrackRemoved,
}: TrackListProps<T>) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isNewPlaylistDialogOpen, setIsNewPlaylistDialogOpen] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [selectedTrackIdForNewPlaylist, setSelectedTrackIdForNewPlaylist] = useState<number | null>(null)

  // Fetch available playlists
  const { data: playlistsData } = useQuery({
    queryKey: ["playlist_gen_playlists_list"],
    queryFn: async () => {
      const response = await get("/playlist_gen/api/v1/playlists", {
        responseKind: "json",
      })
      return response.json as { playlists: PlaylistSummary[] }
    },
  })

  // Create new playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async ({ name, trackId }: { name: string; trackId: number }) => {
      // First create the playlist
      const createResponse = await post("/playlist_gen/api/v1/playlists", {
        body: JSON.stringify({ playlist: { name } }),
        contentType: "application/json",
        responseKind: "json",
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create playlist")
      }

      const createData = await createResponse.json as { playlist: PlaylistSummary }
      
      // Then add the track to it
      const addResponse = await post(`/playlist_gen/api/v1/playlists/${createData.playlist.id}/add_track`, {
        body: JSON.stringify({ track_id: trackId }),
        contentType: "application/json",
        responseKind: "json",
      })

      if (!addResponse.ok) {
        throw new Error("Failed to add track to playlist")
      }

      return createData
    },
    onSuccess: (data) => {
      toast({
        title: "Playlist Created",
        description: `Track added to "${data.playlist.name}"`,
      })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists_list"] })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists"] })
      setIsNewPlaylistDialogOpen(false)
      setNewPlaylistName("")
      setSelectedTrackIdForNewPlaylist(null)
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create playlist",
      })
    },
  })

  // Add track to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: number; trackId: number }) => {
      const response = await post(`/playlist_gen/api/v1/playlists/${playlistId}/add_track`, {
        body: JSON.stringify({ track_id: trackId }),
        contentType: "application/json",
        responseKind: "json",
      })

      if (!response.ok) {
        const errorData = await response.json as { errors?: string[] }
        throw new Error(errorData?.errors?.[0] || "Failed to add track")
      }

      return response.json
    },
    onSuccess: () => {
      toast({
        title: "Track Added",
        description: "Track added to playlist successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists_list"] })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists"] })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlist"] })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    },
  })

  // Remove track from playlist mutation
  const removeFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: number; trackId: number }) => {
      const response = await destroy(`/playlist_gen/api/v1/playlists/${playlistId}/remove_track`, {
        body: JSON.stringify({ track_id: trackId }),
        contentType: "application/json",
        responseKind: "json",
      })

      if (!response.ok) {
        throw new Error("Failed to remove track")
      }

      return response.json
    },
    onSuccess: () => {
      toast({
        title: "Track Removed",
        description: "Track removed from playlist successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists_list"] })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists"] })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlist"] })
      onTrackRemoved?.()
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove track from playlist",
      })
    },
  })

  const handleAddToPlaylist = (playlistId: number, trackId: number) => {
    addToPlaylistMutation.mutate({ playlistId, trackId })
  }

  const handleRemoveFromPlaylist = (trackId: number) => {
    if (playlistId) {
      removeFromPlaylistMutation.mutate({ playlistId, trackId })
    }
  }

  const handleOpenNewPlaylistDialog = (trackId: number) => {
    setSelectedTrackIdForNewPlaylist(trackId)
    setIsNewPlaylistDialogOpen(true)
  }

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() && selectedTrackIdForNewPlaylist) {
      createPlaylistMutation.mutate({
        name: newPlaylistName.trim(),
        trackId: selectedTrackIdForNewPlaylist,
      })
    }
  }

  const playlists = playlistsData?.playlists || []

  if (!tracks.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <Music className="h-8 w-8 mb-2" />
        <p>No tracks found</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            {showPosition && <TableHead className="w-12">#</TableHead>}
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead className="text-center">BPM</TableHead>
            <TableHead className="text-center">Key</TableHead>
            <TableHead className="text-center">Energy</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track) => {
            const id = getId(track)
            const title = getTitle(track)
            const artist = getArtist(track) || "Unknown Artist"
            const bpm = getBpm(track)
            const musicalKey = getKey(track)
            const energy = getEnergy(track)
            const durationLabel = getDurationLabel(track)
            const filePath = getFilePath ? getFilePath(track) : null
            const position = showPosition && getPosition ? getPosition(track) : null

            const searchQuery = getTrackSearchQuery(title, artist)

            return (
              <TableRow key={id} className={cn(currentTrackId === id && "bg-accent")}
              >
                <TableCell>
                  {filePath ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onPlayClick(track)}
                    >
                      {currentTrackId === id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </TableCell>

                {showPosition && (
                  <TableCell className="font-medium text-muted-foreground">
                    {position ?? ""}
                  </TableCell>
                )}

                <TableCell>
                  <div className="font-medium">{title}</div>
                  {getGenre && (
                    <div className="text-sm text-muted-foreground">{getGenre(track)}</div>
                  )}
                </TableCell>
                <TableCell>{artist}</TableCell>
                <TableCell className="text-center">
                  {bpm != null ? (
                    <Badge variant="outline">{bpm.toFixed(1)}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{musicalKey || "—"}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {energy != null ? (
                    <div className="flex items-center justify-center gap-1">
                      <div
                        className={cn("h-2 w-2 rounded-full", getEnergyColor(energy))}
                      />
                      <span className="text-sm">{energy}/10</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{durationLabel}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Playlist Management Section */}
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Playlists
                      </DropdownMenuLabel>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ListPlus className="mr-2 h-4 w-4" />
                          Add to Playlist
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleOpenNewPlaylistDialog(id)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create New Playlist
                            </DropdownMenuItem>
                            {playlists.length > 0 && <DropdownMenuSeparator />}
                            {playlists.map((playlist) => (
                              <DropdownMenuItem
                                key={playlist.id}
                                onClick={() => handleAddToPlaylist(playlist.id, id)}
                                disabled={addToPlaylistMutation.isPending}
                              >
                                <Music className="mr-2 h-4 w-4" />
                                {playlist.name}
                                <span className="ml-auto text-xs text-muted-foreground">
                                  ({playlist.total_tracks})
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      {playlistId && (
                        <DropdownMenuItem
                          onClick={() => handleRemoveFromPlaylist(id)}
                          disabled={removeFromPlaylistMutation.isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from Playlist
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      
                      {filePath && (
                        <>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            DJ Decks
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onAddToDeck(track, "A")}>
                            <Disc className="mr-2 h-4 w-4" />
                            Add to Deck A
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddToDeck(track, "B")}>
                            <Disc className="mr-2 h-4 w-4" />
                            Add to Deck B
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(filePath)
                            }}
                          >
                            <FileAudio className="mr-2 h-4 w-4" />
                            Copy File Path
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openFileLocation(filePath)}>
                            <Folder className="mr-2 h-4 w-4" />
                            Copy Folder Path
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuLabel>Search & Listen</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://www.youtube.com/results?search_query=${searchQuery}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Search on YouTube
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://open.spotify.com/search/${searchQuery}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Search on Spotify
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://soundcloud.com/search?q=${searchQuery}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Search on SoundCloud
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://www.beatport.com/search?q=${searchQuery}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Search on Beatport
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* New Playlist Dialog */}
      <Dialog open={isNewPlaylistDialogOpen} onOpenChange={setIsNewPlaylistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Create a new playlist and add the selected track to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="My Playlist"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPlaylistName.trim()) {
                    handleCreatePlaylist()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewPlaylistDialogOpen(false)
                setNewPlaylistName("")
                setSelectedTrackIdForNewPlaylist(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
            >
              {createPlaylistMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Add Track"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
