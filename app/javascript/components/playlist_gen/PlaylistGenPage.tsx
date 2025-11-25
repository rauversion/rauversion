import React, { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { get, post } from "@rails/request.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Loader2, HelpCircle, Download, RefreshCw, Music, X, AlertCircle, CheckCircle, Eye, Sparkles } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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
  tracks?: Track[]
}

interface LibraryUpload {
  id: number
  status: string
  source: string
  total_tracks_imported: number | null
  error_message: string | null
  created_at?: string
  updated_at?: string
}

interface GenerateSetParams {
  name: string
  duration_minutes: number
  bpm_min: number
  bpm_max: number
  genres: string[]
  energy_curve: string
  prompt: string
}

const ENERGY_CURVES = [
  { value: "linear_up", label: "Linear Up (Low → High)" },
  { value: "constant", label: "Constant (Steady)" },
  { value: "waves", label: "Waves (Oscillating)" },
]

const GENRES = [
  "Techno",
  "Deep Techno",
  "Hard Techno",
  "Industrial Techno",
  "House",
  "Tech House",
  "Deep House",
  "Minimal",
  "Acid",
  "Trance",
  "Progressive",
  "Electro",
  "Ambient",
]

export default function PlaylistGenPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Form state
  const [setName, setSetName] = useState("My DJ Set")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [bpmRange, setBpmRange] = useState([122, 130])
  const [energyCurve, setEnergyCurve] = useState("linear_up")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [prompt, setPrompt] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<number | null>(null)

  // Fetch playlists
  const { data: playlistsData, isLoading: isLoadingPlaylists } = useQuery({
    queryKey: ["playlist_gen_playlists"],
    queryFn: async () => {
      const response = await get("/playlist_gen/api/v1/playlists", {
        responseKind: "json",
      })
      return response.json as { playlists: Playlist[] }
    },
  })

  // Fetch upload status when we have an upload in progress
  const { data: uploadStatus, isLoading: isCheckingUpload } = useQuery({
    queryKey: ["library_upload", currentUploadId],
    queryFn: async () => {
      if (!currentUploadId) return null
      const response = await get(`/playlist_gen/api/v1/library_uploads/${currentUploadId}`, {
        responseKind: "json",
      })
      return response.json as LibraryUpload
    },
    enabled: !!currentUploadId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === "pending" || data?.status === "processing") {
        return 2000 // Poll every 2 seconds while processing
      }
      return false
    },
  })

  // Upload library mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("source", "rekordbox")

      const response = await post("/playlist_gen/api/v1/library_uploads", {
        body: formData as any,
        contentType: false,
        responseKind: "json",
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      return response.json as LibraryUpload
    },
    onSuccess: (data) => {
      setCurrentUploadId(data.id)
      if (data.status === "completed") {
        toast({
          title: "Library Imported",
          description: `Successfully imported ${data.total_tracks_imported} tracks.`,
        })
        setIsUploadDialogOpen(false)
        setUploadFile(null)
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload library file.",
      })
    },
  })

  // Generate set mutation
  const generateMutation = useMutation({
    mutationFn: async (params: GenerateSetParams) => {
      const response = await post("/playlist_gen/api/v1/sets/generate", {
        body: JSON.stringify(params),
        contentType: "application/json",
        responseKind: "json",
      })

      if (!response.ok) {
        const errorData = response.json
        throw new Error(errorData?.error || "Generation failed")
      }

      return response.json as { playlist: Playlist }
    },
    onSuccess: (data) => {
      toast({
        title: "Set Generated",
        description: `Created "${data.playlist.name}" with ${data.playlist.total_tracks} tracks.`,
      })
      queryClient.invalidateQueries({ queryKey: ["playlist_gen_playlists"] })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message,
      })
    },
  })

  const handleGenerate = () => {
    generateMutation.mutate({
      name: setName,
      duration_minutes: durationMinutes,
      bpm_min: bpmRange[0],
      bpm_max: bpmRange[1],
      genres: selectedGenres,
      energy_curve: energyCurve,
      prompt: prompt,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUpload = () => {
    if (uploadFile) {
      uploadMutation.mutate(uploadFile)
    }
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  const handleExportM3U = async (playlistId: number) => {
    window.location.href = `/playlist_gen/api/v1/playlists/${playlistId}/export_m3u`
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DJ Set Generator</h1>
          <p className="text-muted-foreground">
            Generate intelligent DJ sets from your Rekordbox library
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Library
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Rekordbox Library</DialogTitle>
              <DialogDescription>
                Upload your Rekordbox collection.xml file to import your track library.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="library-file">Library File</Label>
                <Input
                  id="library-file"
                  type="file"
                  accept=".xml"
                  onChange={handleFileChange}
                />
              </div>
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFile.name}
                </p>
              )}
              {uploadStatus && (
                <div className="flex items-center gap-2">
                  {uploadStatus.status === "processing" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </>
                  )}
                  {uploadStatus.status === "completed" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Imported {uploadStatus.total_tracks_imported} tracks
                      </span>
                    </>
                  )}
                  {uploadStatus.status === "failed" && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">
                        {uploadStatus.error_message || "Import failed"}
                      </span>
                    </>
                  )}
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Set Generation Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generate New Set</CardTitle>
            <CardDescription>
              Configure your set parameters and let the algorithm create an optimal playlist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="set-name">Set Name</Label>
                <Input
                  id="set-name"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="e.g., Peak Time Set"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  min={15}
                  max={360}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                BPM Range: {bpmRange[0]} - {bpmRange[1]}
              </Label>
              <Slider
                value={bpmRange}
                onValueChange={setBpmRange}
                min={80}
                max={180}
                step={1}
                className="py-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="energy-curve">Energy Curve</Label>
              <Select value={energyCurve} onValueChange={setEnergyCurve}>
                <SelectTrigger>
                  <SelectValue placeholder="Select energy curve" />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_CURVES.map((curve) => (
                    <SelectItem key={curve.value} value={curve.value}>
                      {curve.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Genres (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                    {selectedGenres.includes(genre) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Prompt (optional)
                </span>
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your ideal set... e.g., 'Dark driving techno with hypnotic basslines, perfect for peak time at 3am'"
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Use natural language to describe the vibe you're looking for. The AI will search for matching tracks using semantic similarity.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Generate Set
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Stats / Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Algorithm Info</CardTitle>
            <CardDescription>How sets are generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">BPM Matching</p>
                <p className="text-muted-foreground">
                  Tracks are selected to minimize BPM jumps for smooth transitions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Key Compatibility</p>
                <p className="text-muted-foreground">
                  Uses Camelot wheel for harmonic mixing suggestions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Energy Progression</p>
                <p className="text-muted-foreground">
                  Builds energy according to your selected curve pattern.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Artist Variety</p>
                <p className="text-muted-foreground">
                  Avoids consecutive tracks from the same artist.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Playlists */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Sets</CardTitle>
          <CardDescription>Your previously generated DJ sets</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPlaylists ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : playlistsData?.playlists?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tracks</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>BPM Range</TableHead>
                  <TableHead>Energy Curve</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlistsData.playlists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell className="font-medium">{playlist.name}</TableCell>
                    <TableCell>{playlist.total_tracks}</TableCell>
                    <TableCell>{playlist.duration_human}</TableCell>
                    <TableCell>
                      {playlist.bpm_min} - {playlist.bpm_max}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{playlist.energy_curve}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(playlist.generated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/set-generator/playlists/${playlist.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Export</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportM3U(playlist.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download M3U
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Music className="h-8 w-8 mb-2" />
              <p>No sets generated yet</p>
              <p className="text-sm">Import your library and generate your first set!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
