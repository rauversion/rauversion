import React from "react"

import { Button } from "@/components/ui/button"
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
import { ExternalLink, FileAudio, Folder, MoreHorizontal, Music, Pause, Play, Disc } from "lucide-react"
import { cn } from "@/lib/utils"

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
}: TrackListProps<T>) {
  if (!tracks.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <Music className="h-8 w-8 mb-2" />
        <p>No tracks found</p>
      </div>
    )
  }

  return (
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
  )
}
