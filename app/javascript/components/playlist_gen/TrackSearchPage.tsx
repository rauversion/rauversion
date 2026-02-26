import React, { useState, useRef, useEffect, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { get } from "@rails/request.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Loader2,
  Search,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useDjDecksStore from "@/stores/djDecksStore"
import { TrackList } from "./TrackList"

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

  // DJ Decks store for adding tracks to decks
  const { addToDeckA, addToDeckB } = useDjDecksStore()

  // Audio player state (similar to PlaylistShowPage)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  // Helper to add track to deck
  const handleAddToDeck = (track: Track, deck: "A" | "B") => {
    if (!track.file_path) {
      toast({
        variant: "destructive",
        title: "Cannot add to deck",
        description: "This track does not have a playable file.",
      })
      return
    }

    const deckTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      streamUrl: getStreamUrl(track.id),
      duration: track.duration_seconds || undefined,
      bpm: track.bpm || undefined,
      key: track.key || undefined,
    }

    if (deck === "A") {
      addToDeckA(deckTrack)
    } else {
      addToDeckB(deckTrack)
    }

    toast({
      title: `Added to Deck ${deck}`,
      description: `${track.title} - ${track.artist || "Unknown Artist"}`,
    })

    // Mixer ya está fijo en layout, no navegamos a una ruta aparte
    // navigate("/set-generator/decks")
  }

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchPrompt: string): Promise<SearchResult> => {
      const response = await get("/playlist_gen/api/v1/tracks/search_by_prompt", {
        query: { prompt: searchPrompt, limit: 50 },
        responseKind: "json",
      })

      if (!response.ok) {
        const errorData = await response.json
        throw new Error((errorData as any)?.error || "Search failed")
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

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return "—"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStreamUrl = (trackId: number) => `/playlist_gen/api/v1/tracks/${trackId}/stream`

  const tracks = searchMutation.data?.tracks || []
  const currentTrack = tracks.find((t) => t.id === currentTrackId) || null

  // Handle next/prev track using the current search results
  const handleNextTrack = useCallback(() => {
    if (!tracks.length || !currentTrackId) return
    const currentIndex = tracks.findIndex((t) => t.id === currentTrackId)
    if (currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1]
      if (nextTrack.file_path) {
        setCurrentTrackId(nextTrack.id)
        setCurrentTime(0)
        setDuration(nextTrack.duration_seconds || 0)
      }
    }
  }, [tracks, currentTrackId])

  const handlePrevTrack = () => {
    if (!tracks.length || !currentTrackId) return
    const currentIndex = tracks.findIndex((t) => t.id === currentTrackId)
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1]
      if (prevTrack.file_path) {
        setCurrentTrackId(prevTrack.id)
        setCurrentTime(0)
        setDuration(prevTrack.duration_seconds || 0)
      }
    }
  }

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => handleNextTrack()
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [currentTrackId, handleNextTrack])

  // Auto-play when track changes
  useEffect(() => {
    if (currentTrackId && audioRef.current) {
      audioRef.current
        .play()
        .catch(() => {
          // Auto-play may be blocked by browser policy
        })
    }
  }, [currentTrackId])

  // Play a specific track from the search results
  const playTrack = (track: Track) => {
    if (!track.file_path) return

    if (currentTrackId === track.id && audioRef.current) {
      // Toggle play/pause for same track
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {
          // Play may be blocked by browser policy
        })
      }
    } else {
      // Play new track - setting currentTrackId will trigger auto-play via useEffect
      setCurrentTrackId(track.id)
      setCurrentTime(0)
      setDuration(track.duration_seconds || 0)
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {
        // Play may be blocked by browser policy
      })
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
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
            <TrackList
              tracks={tracks}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onPlayClick={playTrack}
              onAddToDeck={handleAddToDeck}
              getId={(track) => track.id}
              getTitle={(track) => track.title}
              getArtist={(track) => track.artist}
              getBpm={(track) => track.bpm}
              getKey={(track) => track.key}
              getGenre={(track) => track.genre}
              getEnergy={(track) => track.energy}
              getDurationLabel={(track) => formatDuration(track.duration_seconds)}
              getFilePath={(track) => track.file_path}
            />
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

      {/* Mini Audio Player - Fixed at bottom when a track is selected */}
      {currentTrackId && currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Track Info */}
              <div className="flex-shrink-0 min-w-0 w-48">
                <div className="font-medium text-sm truncate">{currentTrack.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentTrack.artist || "Unknown Artist"}
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handlePrevTrack}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleNextTrack}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <Input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={1}
                  value={currentTime}
                  onChange={(e) => handleSeek([Number(e.target.value)])}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange([Number(e.target.value)])}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentTrackId ? getStreamUrl(currentTrackId) : undefined}
            preload="metadata"
          />
        </div>
      )}

      {/* Spacer when player is visible */}
      {currentTrackId && <div className="h-20" />}
    </div>
  )
}
