import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { put, post, destroy } from "@rails/request.js"
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function SortableTrackItem({ track, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-4 py-4 px-2 border-b border-border hover:bg-accent/50 rounded-lg"
    >
      <div
        className="cursor-move text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-shrink-0">
        <img
          src={track.cover_url?.small}
          alt={track.title}
          className="h-10 w-10 rounded-lg object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {track.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {track.user?.username}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) =>onRemove(track)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

const PlaylistTracks = ({ playlist, onTrackOrderChange }) => {
  const { toast } = useToast()
  const [tracks, setTracks] = useState(playlist?.track_playlists || [])

  useEffect(() => {
    if (playlist?.track_playlists) {
      setTracks(playlist.track_playlists)
    }
  }, [playlist])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = tracks.findIndex((track) => track.id === active.id)
      const newIndex = tracks.findIndex((track) => track.id === over.id)

      const newTracks = arrayMove(tracks, oldIndex, newIndex).map((track, index) => ({
        ...track,
        position: index + 1
      }))

      setTracks(newTracks)
      onTrackOrderChange?.(newTracks)

      // Update positions on the server
      updateTrackPositions(newTracks)
    }
  }

  const updateTrackPositions = async (items) => {
    try {
      const positions = items.map((item, index) => ({
        id: item.track_playlist_id,
        position: index + 1
      }))

      const response = await post(`/playlists/${playlist.slug}/sort`, {
        responseKind: "json",
        body: JSON.stringify({ positions })
      })

      if (!response.ok) {
        throw new Error("Failed to update track positions")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update track order",
        variant: "destructive"
      })
    }
  }

  const handleRemoveTrack = async (track) => {
    try {
      const newTracks = tracks.filter(t => t.id !== track.id)
      setTracks(newTracks)
      onTrackOrderChange?.(newTracks)

      const response = await destroy(`/track_playlists/${playlist.id}`, {
        responseKind: "json",
        body: JSON.stringify({
          track_playlist: {
            track_id: track.id,
            _destroy: true
          }
        })
      })

      if (!response.ok) {
        throw new Error("Failed to remove track")
      }

      toast({
        title: "Success",
        description: "Track removed from playlist"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove track",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tracks.map(t => ({ ...t, id: t.id }))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {tracks.map((track) => (
              <SortableTrackItem
                key={track.id}
                track={track}
                onRemove={handleRemoveTrack}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tracks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No tracks in this playlist yet
        </div>
      )}
    </div>
  )
}

export default PlaylistTracks
