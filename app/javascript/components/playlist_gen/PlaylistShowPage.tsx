import React from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { get } from "@rails/request.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileAudio,
  Folder,
  Loader2,
  MoreHorizontal,
  Music,
  Play,
} from "lucide-react"

interface Track {
  id: number
  position: number
  title: string
  artist: string
  bpm: number
  key: string
  genre: string
  energy: number
  duration_seconds: number
  duration_human: string
  file_path: string | null
}

interface Playlist {
  id: number
  name: string
  duration_seconds: number
  duration_human: string
  bpm_min: number
  bpm_max: number
  energy_curve: string
  total_tracks: number
  status: string
  prompt: string | null
  generated_at: string
  tracks: Track[]
}

export default function PlaylistShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ["playlist_gen_playlist", id],
    queryFn: async () => {
      const response = await get(`/playlist_gen/api/v1/playlists/${id}`, {
        responseKind: "json",
      })
      return response.json as { playlist: Playlist }
    },
    enabled: !!id,
  })

  const playlist = data?.playlist

  const handleExportM3U = () => {
    window.location.href = `/playlist_gen/api/v1/playlists/${id}/export_m3u`
  }

  const openFileLocation = (filePath: string | null) => {
    if (!filePath) return

    // For macOS, this would open Finder at the file location
    // This creates a file:// URL that can be used
    const folderPath = filePath.substring(0, filePath.lastIndexOf("/"))
    
    // We'll create a link that users can copy
    navigator.clipboard.writeText(folderPath)
  }

  const getEnergyColor = (energy: number) => {
    if (energy <= 3) return "bg-green-500"
    if (energy <= 5) return "bg-yellow-500"
    if (energy <= 7) return "bg-orange-500"
    return "bg-red-500"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Playlist not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/set-generator")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/set-generator")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{playlist.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {playlist.total_tracks} tracks · {playlist.duration_human} ·{" "}
            {playlist.bpm_min}-{playlist.bpm_max} BPM
          </p>
          {playlist.prompt && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">Prompt:</span> {playlist.prompt}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportM3U}>
            <Download className="mr-2 h-4 w-4" />
            Export M3U
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Duration</CardDescription>
            <CardTitle className="text-2xl">{playlist.duration_human}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>BPM Range</CardDescription>
            <CardTitle className="text-2xl">
              {playlist.bpm_min} - {playlist.bpm_max}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Energy Curve</CardDescription>
            <CardTitle className="text-2xl capitalize">
              {playlist.energy_curve.replace("_", " ")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Generated</CardDescription>
            <CardTitle className="text-2xl">
              {new Date(playlist.generated_at).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Track List */}
      <Card>
        <CardHeader>
          <CardTitle>Tracklist</CardTitle>
          <CardDescription>
            Tracks ordered by position with BPM and key information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
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
              {playlist.tracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {track.position}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{track.title}</div>
                    {track.genre && (
                      <div className="text-sm text-muted-foreground">{track.genre}</div>
                    )}
                  </TableCell>
                  <TableCell>{track.artist || "Unknown Artist"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{track.bpm.toFixed(1)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{track.key || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full ${getEnergyColor(track.energy)}`}
                      />
                      <span className="text-sm">{track.energy}/10</span>
                    </div>
                  </TableCell>
                  <TableCell>{track.duration_human}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Track Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {track.file_path && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(track.file_path!)
                              }}
                            >
                              <FileAudio className="mr-2 h-4 w-4" />
                              Copy File Path
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openFileLocation(track.file_path)}
                            >
                              <Folder className="mr-2 h-4 w-4" />
                              Copy Folder Path
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            const searchQuery = encodeURIComponent(
                              `${track.artist} ${track.title}`
                            )
                            window.open(
                              `https://www.youtube.com/results?search_query=${searchQuery}`,
                              "_blank"
                            )
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Search on YouTube
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const searchQuery = encodeURIComponent(
                              `${track.artist} ${track.title}`
                            )
                            window.open(
                              `https://open.spotify.com/search/${searchQuery}`,
                              "_blank"
                            )
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Search on Spotify
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const searchQuery = encodeURIComponent(
                              `${track.artist} ${track.title}`
                            )
                            window.open(
                              `https://soundcloud.com/search?q=${searchQuery}`,
                              "_blank"
                            )
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Search on SoundCloud
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const searchQuery = encodeURIComponent(
                              `${track.artist} ${track.title}`
                            )
                            window.open(
                              `https://www.beatport.com/search?q=${searchQuery}`,
                              "_blank"
                            )
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Search on Beatport
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
