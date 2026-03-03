import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Plus, Edit, Play, Pause, Tag, Music2, ChevronLeft, ChevronRight } from "lucide-react"
import { get } from "@rails/request.js"
import useAudioStore from "@/stores/audioStore"
import TrackEdit from "./TrackEdit"
import I18n from "stores/locales"

interface Track {
  id: number
  title: string
  slug: string
  tags: string[]
  genre: string
  state: string
  created_at: string
  cover_url: {
    medium: string
    small: string
    large: string
    cropped_image: string
  }
  mp3_audio_url?: string
  user: {
    username: string
  }
  metadata?: {
    peaks?: number[]
  }
}

interface Meta {
  total_pages: number
  current_page: number
  total_count: number
}

export default function TracksAdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [noTagsOnly, setNoTagsOnly] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [editTrack, setEditTrack] = useState<Track | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Wizard state
  const [wizardMode, setWizardMode] = useState(false)
  const [wizardIndex, setWizardIndex] = useState(0)
  const [wizardTracks, setWizardTracks] = useState<Track[]>([])

  const { play, pause, currentTrackId, isPlaying } = useAudioStore()

  const fetchTracks = async (q: string, noTags: boolean, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (noTags) params.set("no_tags", "true")
      params.set("page", String(p))
      const response = await get(`/tracks/mine.json?${params.toString()}`)
      if (response.ok) {
        const data = await response.json
        setTracks(data.tracks || [])
        setMeta(data.meta || null)
      }
    } catch (error) {
      console.error("Error fetching tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks("", false, 1)
  }, [])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchTracks(searchQuery, noTagsOnly, newPage)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTracks(searchQuery, noTagsOnly, 1)
  }

  const handleNoTagsToggle = (value: boolean) => {
    setNoTagsOnly(value)
    setPage(1)
    fetchTracks(searchQuery, value, 1)
  }

  const handlePlay = (e: React.MouseEvent, track: Track) => {
    e.preventDefault()
    if (currentTrackId === track.id && isPlaying) {
      pause()
    } else {
      play(track.id)
    }
  }

  const handleEdit = (track: Track) => {
    setEditTrack(track)
    setEditOpen(true)
  }

  const handleEditOk = () => {
    fetchTracks(searchQuery, noTagsOnly, page)
    if (wizardMode && wizardTracks.length > 0) {
      const updatedTracks = wizardTracks.filter((_, i) => i !== wizardIndex)
      setWizardTracks(updatedTracks)
      if (wizardIndex >= updatedTracks.length && wizardIndex > 0) {
        setWizardIndex(wizardIndex - 1)
      }
    }
  }

  const startWizard = async () => {
    setLoading(true)
    try {
      const response = await get("/tracks/mine.json?no_tags=true&page=1")
      if (response.ok) {
        const data = await response.json
        const untagged: Track[] = data.tracks || []
        setWizardTracks(untagged)
        setWizardIndex(0)
        setWizardMode(true)
        if (untagged.length > 0) {
          play(untagged[0].id)
        }
      }
    } catch (error) {
      console.error("Error starting wizard:", error)
    } finally {
      setLoading(false)
    }
  }

  const wizardNext = () => {
    const nextIndex = wizardIndex + 1
    if (nextIndex < wizardTracks.length) {
      setWizardIndex(nextIndex)
      play(wizardTracks[nextIndex].id)
    }
  }

  const wizardPrev = () => {
    const prevIndex = wizardIndex - 1
    if (prevIndex >= 0) {
      setWizardIndex(prevIndex)
      play(wizardTracks[prevIndex].id)
    }
  }

  const wizardEditCurrent = () => {
    if (wizardTracks[wizardIndex]) {
      handleEdit(wizardTracks[wizardIndex])
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(I18n.locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const currentWizardTrack = wizardTracks[wizardIndex]

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {I18n.t("tracks.mine.title")}
              </h1>
              <p className="text-muted-foreground">{I18n.t("tracks.mine.subtitle")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={startWizard} disabled={loading}>
                <Tag className="h-4 w-4 mr-2" />
                {I18n.t("tracks.mine.wizard.title")}
              </Button>
              <Button asChild>
                <Link to="/tracks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {I18n.t("tracks.mine.upload_new")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Wizard Panel */}
          {wizardMode && (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{I18n.t("tracks.mine.wizard.title")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {I18n.t("tracks.mine.wizard.description")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setWizardMode(false)}>
                    ✕
                  </Button>
                </div>

                {wizardTracks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {I18n.t("tracks.mine.wizard.no_more_tracks")}
                  </p>
                ) : (
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Track Cover & Info */}
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                        {currentWizardTrack?.cover_url?.medium ? (
                          <img
                            src={currentWizardTrack.cover_url.medium}
                            alt={currentWizardTrack.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Music2 className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          onClick={(e) => currentWizardTrack && handlePlay(e, currentWizardTrack)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          {currentTrackId === currentWizardTrack?.id && isPlaying ? (
                            <Pause className="w-10 h-10 text-white" />
                          ) : (
                            <Play className="w-10 h-10 text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Track Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold truncate">{currentWizardTrack?.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {currentWizardTrack?.user?.username}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {currentWizardTrack?.tags?.length === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {I18n.t("tracks.mine.no_tags_badge")}
                          </Badge>
                        )}
                        {currentWizardTrack?.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button onClick={wizardEditCurrent} className="w-full md:w-auto">
                        <Edit className="h-4 w-4 mr-2" />
                        {I18n.t("tracks.mine.edit")}
                      </Button>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col items-center gap-3 flex-shrink-0">
                      <p className="text-sm text-muted-foreground text-center">
                        {I18n.t("tracks.mine.wizard.progress", {
                          current: wizardIndex + 1,
                          total: wizardTracks.length,
                        })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={wizardPrev}
                          disabled={wizardIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={wizardNext}
                          disabled={wizardIndex >= wizardTracks.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      {wizardIndex >= wizardTracks.length - 1 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setWizardMode(false)}
                        >
                          {I18n.t("tracks.mine.wizard.done")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="w-full md:w-1/2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={I18n.t("tracks.mine.search_placeholder")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex gap-2">
              <Button
                variant={!noTagsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => handleNoTagsToggle(false)}
              >
                {I18n.t("tracks.mine.filter_all")}
              </Button>
              <Button
                variant={noTagsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => handleNoTagsToggle(true)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {I18n.t("tracks.mine.filter_no_tags")}
              </Button>
            </div>
          </div>

          {/* Tracks Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{I18n.t("tracks.mine.table_track")}</TableHead>
                  <TableHead>{I18n.t("tracks.mine.table_tags")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {I18n.t("tracks.mine.table_date")}
                  </TableHead>
                  <TableHead className="text-right">
                    {I18n.t("tracks.mine.table_actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : tracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Music2 className="h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">{I18n.t("tracks.mine.no_tracks")}</p>
                        <p className="text-sm text-muted-foreground">
                          {I18n.t("tracks.mine.no_tracks_hint")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            {track.cover_url?.medium ? (
                              <img
                                src={track.cover_url.medium}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Music2 className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <button
                              onClick={(e) => handlePlay(e, track)}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                            >
                              {currentTrackId === track.id && isPlaying ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white" />
                              )}
                            </button>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground">{track.user?.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {track.tags?.length === 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {I18n.t("tracks.mine.no_tags_badge")}
                            </Badge>
                          ) : (
                            track.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          )}
                          {(track.tags?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{track.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(track.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(track)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {I18n.t("tracks.mine.edit")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(meta.total_pages, page + 1))}
                disabled={page === meta.total_pages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Track Edit Dialog */}
      {editTrack && (
        <TrackEdit
          track={editTrack}
          open={editOpen}
          onOpenChange={setEditOpen}
          onOk={handleEditOk}
        />
      )}
    </div>
  )
}

