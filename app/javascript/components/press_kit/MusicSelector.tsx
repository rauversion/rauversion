import React, { useEffect } from "react"
import Select from "react-select/async"
import { get } from "@rails/request.js"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import selectTheme from "@/components/ui/selectTheme"
import { X, GripVertical } from "lucide-react"
import useAuthStore from "@/stores/authStore"

type TrackOption = {
  value: number | string
  label: string
  track: {
    id: number | string
    title: string
    cover_url?: any
  }
}

type PlaylistOption = {
  value: number | string
  label: string
  playlist: {
    id: number | string
    title: string
    slug?: string
    cover_url?: any
  }
}

function SortableCard({
  id,
  idx,
  item,
  onRemove,
}: {
  id: string | number
  idx: number
  item: any
  onRemove: (item: any) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-secondary/5 rounded border border-border p-2 flex items-center gap-3">
      <button {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {item.cover_url ? (
        <img src={item.cover_url.small || item.cover_url.medium || item.cover_url} alt={item.title} className="h-10 w-10 object-cover rounded" />
      ) : (
        <div className="h-10 w-10 bg-muted-foreground/10 rounded flex items-center justify-center text-sm">No</div>
      )}

      <div className="flex-1">
        <div className="font-medium">{item.title}</div>
      </div>

      <Button variant="ghost" size="icon" onClick={() => onRemove(item)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function MusicSelector({
  username,
  selectedTracks,
  setSelectedTracks,
  selectedPlaylists,
  setSelectedPlaylists,
  isDark,
}: {
  username: string
  selectedTracks: any[]
  setSelectedTracks: (t: any[]) => void
  selectedPlaylists: any[]
  setSelectedPlaylists: (p: any[]) => void
  isDark?: boolean
}) {
  const { currentUser } = useAuthStore()
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    // ensure arrays exist
    if (!Array.isArray(selectedTracks)) setSelectedTracks([])
    if (!Array.isArray(selectedPlaylists)) setSelectedPlaylists([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTrackOptions = async (inputValue: string) => {
    try {
      const response = await get(`/${username}/tracks/search.json`, { query: { q: inputValue || "" } })
      if (response.ok) {
        const data = await response.json
        return (data.collection || []).map((track: any) => ({
          value: track.id,
          label: track.title,
          track: {
            id: track.id,
            title: track.title,
            cover_url: track.cover_url,
          },
        }))
      }
      return []
    } catch (e) {
      console.error("Error loading track options", e)
      return []
    }
  }

  const loadPlaylistOptions = async (inputValue: string) => {
    try {
      // Try playlists search endpoint; if doesn't exist server should return empty
      const response = await get(`/${username}/playlists/search.json`, { query: { q: inputValue || "" } })
      if (response.ok) {
        const data = await response.json
        return (data.collection || []).map((pl: any) => ({
          value: pl.id,
          label: pl.title,
          playlist: { id: pl.id, title: pl.title, slug: pl.slug, cover_url: pl.cover_url },
        }))
      }
      return []
    } catch (e) {
      // fallback: try /:username/playlists.json
      try {
        const r2 = await get(`/${username}/playlists.json`)
        if (r2.ok) {
          const d2 = await r2.json
          return (d2.collection || []).map((pl: any) => ({
            value: pl.id,
            label: pl.title,
            playlist: { id: pl.id, title: pl.title, slug: pl.slug, cover_url: pl.cover_url },
          }))
        }
      } catch (e2) {
        console.error("Error loading playlist options", e2)
      }
      return []
    }
  }

  const handleAddTrack = (option: TrackOption | null) => {
    if (!option) return
    const exists = selectedTracks.find((t) => t.id === option.track.id)
    if (exists) return
    setSelectedTracks([...selectedTracks, option.track])
  }

  const handleAddPlaylist = (option: PlaylistOption | null) => {
    if (!option) return
    const exists = selectedPlaylists.find((p) => p.id === option.playlist.id)
    if (exists) return
    setSelectedPlaylists([...selectedPlaylists, option.playlist])
  }

  const handleRemoveTrack = (track: any) => {
    setSelectedTracks(selectedTracks.filter((t) => t.id !== track.id))
  }

  const handleRemovePlaylist = (pl: any) => {
    setSelectedPlaylists(selectedPlaylists.filter((p) => p.id !== pl.id))
  }

  const onDragEndTracks = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = selectedTracks.findIndex((t) => t.id.toString() === active.id.toString())
    const newIndex = selectedTracks.findIndex((t) => t.id.toString() === over.id.toString())
    if (oldIndex === -1 || newIndex === -1) return
    const newArr = [...selectedTracks]
    const [moved] = newArr.splice(oldIndex, 1)
    newArr.splice(newIndex, 0, moved)
    setSelectedTracks(newArr)
  }

  const onDragEndPlaylists = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = selectedPlaylists.findIndex((t) => t.id.toString() === active.id.toString())
    const newIndex = selectedPlaylists.findIndex((t) => t.id.toString() === over.id.toString())
    if (oldIndex === -1 || newIndex === -1) return
    const newArr = [...selectedPlaylists]
    const [moved] = newArr.splice(oldIndex, 1)
    newArr.splice(newIndex, 0, moved)
    setSelectedPlaylists(newArr)
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Add Tracks (from your profile)</label>
          <Select
            className="basic-single"
            classNamePrefix="select"
            placeholder="Search your tracks..."
            isClearable
            isSearchable
            defaultOptions
            loadOptions={loadTrackOptions}
            onChange={(opt) => handleAddTrack(opt as TrackOption)}
            theme={(theme) => selectTheme(theme, !!isDark)}
            noOptionsMessage={() => "No tracks found"}
          />

          <div className="mt-3 space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndTracks}>
              <SortableContext items={selectedTracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {selectedTracks.map((track) => (
                    <SortableCard key={track.id} id={track.id} idx={0} item={track} onRemove={handleRemoveTrack} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Add Playlists (from your profile)</label>
          <Select
            className="basic-single"
            classNamePrefix="select"
            placeholder="Search your playlists..."
            isClearable
            isSearchable
            defaultOptions
            loadOptions={loadPlaylistOptions}
            onChange={(opt) => handleAddPlaylist(opt as PlaylistOption)}
            theme={(theme) => selectTheme(theme, !!isDark)}
            noOptionsMessage={() => "No playlists found"}
          />

          <div className="mt-3 space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndPlaylists}>
              <SortableContext items={selectedPlaylists.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {selectedPlaylists.map((pl) => (
                    <SortableCard key={pl.id} id={pl.id} idx={0} item={pl} onRemove={handleRemovePlaylist} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  )
}
