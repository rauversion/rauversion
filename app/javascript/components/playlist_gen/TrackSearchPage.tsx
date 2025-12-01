import React, { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { get } from "@rails/request.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ArrowLeft, ExternalLink, Loader2, MoreHorizontal, Music, Search, Sparkles } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Track {
  id: number
  title: string
  artist: string
  bpm: number | null
  key: string | null
  genre: string | null
  energy: number | null
  duration_seconds: number | null
  file_path: string | null
  source: string | null
}

interface SearchResult {
  tracks: Track[]
  count: number
  prompt: string
}

export default function TrackSearchPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState("")

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchPrompt: string): Promise<SearchResult> => {
      const response = await get("/playlist_gen/api/v1/tracks/search_by_prompt", {
        query: { prompt: searchPrompt, limit: 50 },
        responseKind: "json",
      })

      if (!response.ok) {
        const errorData = await response.json
        throw new Error(errorData?.error || "Search failed")
      }

      return response.json as SearchResult
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error.message,
      })
    },
  })

  const handleSearch = () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt Required",
        description: "Please enter a search prompt.",
      })
      return
    }
    searchMutation.mutate(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const getEnergyColor = (energy: number | null) => {
    if (energy === null) return "bg-gray-400"
    if (energy <= 3) return "bg-green-500"
    if (energy <= 5) return "bg-yellow-500"
    if (energy <= 7) return "bg-orange-500"
    return "bg-red-500"
  }

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return "—"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTrackSearchQuery = (track: Track): string => {
    return encodeURIComponent(`${track.artist || ""} ${track.title}`.trim())
  }

  const openExternalSearch = (track: Track, platform: "youtube" | "spotify" | "soundcloud" | "beatport") => {
    const searchQuery = getTrackSearchQuery(track)
    const urls: Record<string, string> = {
      youtube: `https://www.youtube.com/results?search_query=${searchQuery}`,
      spotify: `https://open.spotify.com/search/${searchQuery}`,
      soundcloud: `https://soundcloud.com/search?q=${searchQuery}`,
      beatport: `https://www.beatport.com/search?q=${searchQuery}`,
    }
    window.open(urls[platform], "_blank")
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
            <h1 className="text-3xl font-bold">Track Search</h1>
          </div>
          <p className="text-muted-foreground">
            Search tracks using AI semantic similarity for manual curation
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Search
          </CardTitle>
          <CardDescription>
            Enter a natural language prompt to find matching tracks in your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-prompt">Search Prompt</Label>
            <Textarea
              id="search-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Dark driving techno with hypnotic basslines, melodic progressive house, acid techno with 303 sounds..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Describe the style, mood, or characteristics of tracks you're looking for. Press Enter to search.
            </p>
          </div>
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending || !prompt.trim()}
            className="w-full sm:w-auto"
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Tracks
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchMutation.data.count} tracks matching: "{searchMutation.data.prompt}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchMutation.data.tracks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {searchMutation.data.tracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell>
                        <div className="font-medium">{track.title}</div>
                        {track.genre && (
                          <div className="text-sm text-muted-foreground">{track.genre}</div>
                        )}
                      </TableCell>
                      <TableCell>{track.artist || "Unknown Artist"}</TableCell>
                      <TableCell className="text-center">
                        {track.bpm ? (
                          <Badge variant="outline">{track.bpm.toFixed(1)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{track.key || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {track.energy !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${getEnergyColor(track.energy)}`}
                            />
                            <span className="text-sm">{track.energy}/10</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(track.duration_seconds)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Search & Listen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openExternalSearch(track, "youtube")}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Search on YouTube
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openExternalSearch(track, "spotify")}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Search on Spotify
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openExternalSearch(track, "soundcloud")}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Search on SoundCloud
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openExternalSearch(track, "beatport")}>
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
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Music className="h-8 w-8 mb-2" />
                <p>No tracks found matching your prompt</p>
                <p className="text-sm">Try a different description or import more tracks</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Search Yet */}
      {!searchMutation.data && !searchMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Search className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Ready to Search</p>
            <p className="text-sm">Enter a prompt above to find matching tracks</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
