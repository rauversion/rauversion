import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { get, post, put, destroy } from '@rails/request.js'
import Select from 'react-select/async'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, GripVertical } from 'lucide-react'
import I18n from '@/stores/locales'
import selectTheme from "@/components/ui/selectTheme"
import { useThemeStore } from '@/stores/theme'
import useAuthStore from '@/stores/authStore'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import TrackItem from './TrackItem'
import { CSS } from '@dnd-kit/utilities'

const CustomOption = ({ innerProps, label, data }) => (
  <div {...innerProps} className="flex items-center p-2 cursor-pointer hover:bg-accent">
    <img
      src={data.track.cover_url.medium}
      alt={label}
      className="h-10 w-10 object-cover rounded mr-3"
    />
    <div>
      <div className="font-medium">{label}</div>
    </div>
  </div>
)

const SortableSpotlightItem = ({ spotlight, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: spotlight.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <img
            src={spotlight.track.cover_url?.small}
            alt={spotlight.track.title}
            className="h-12 w-12 object-cover rounded"
          />
          <div>
            <h3 className="font-medium">{spotlight.track.title}</h3>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(spotlight)}
          className="absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SpotlightEditor({ isPlaying, handlePlay, currentTrackId }) {
  const { username } = useParams()
  const { toast } = useToast()
  const [spotlights, setSpotlights] = useState([])
  const [loading, setLoading] = useState(true)
  const { isDarkMode } = useThemeStore()
  const [isEditing, setIsEditing] = useState(false)
  const {currentUser} = useAuthStore()

  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchSpotlights()
  }, [username])

  const fetchSpotlights = async () => {
    try {
      const response = await get(`/spotlight.json`)
      if (response.ok) {
        const data = await response.json
        setSpotlights(data.collection || [])
      }
    } catch (error) {
      console.error('Error fetching spotlights:', error)
      toast({
        title: "Error",
        description: "Could not load spotlights",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTrackOptions = async (inputValue) => {
    try {
      const response = await get(`/${username}/tracks/search.json`, {
        query: { q: inputValue || '' }
      })

      if (response.ok) {
        const data = await response.json
        return data.collection.map(track => ({
          value: track.id,
          label: track.title,
          track: {
            id: track.id,
            title: track.title,
            description: track.description,
            cover_url: track.cover_url
          }
        }))
      }
      return []
    } catch (error) {
      console.error('Error searching tracks:', error)
      toast({
        title: "Error",
        description: "Could not search tracks",
        variant: "destructive",
      })
      return []
    }
  }

  const handleAddSpotlight = async (selectedOption) => {
    if (!selectedOption) return

    try {
      const formData = {
        form_models_spotlight_form: {
          items_attributes: {
            ...spotlights.reduce((acc, spotlight, index) => ({
              ...acc,
              [index]: {
                _destroy: false,
                id: spotlight.id,
                spotlightable_type: 'Track',
                spotlightable_id: spotlight.track.id,
                position: index + 1
              }
            }), {}),
            [spotlights.length]: {
              _destroy: false,
              id: '',
              spotlightable_type: 'Track',
              spotlightable_id: selectedOption.value,
              position: spotlights.length + 1
            }
          }
        }
      }

      const response = await post(`/spotlight.json`, {
        body: formData
      })

      if (response.ok) {
        const data = await response.json
        setSpotlights(prev => [...prev, data])
        toast({
          title: "Success",
          description: "Track added to spotlights",
        })
      }
    } catch (error) {
      console.error('Error adding spotlight:', error)
      toast({
        title: "Error",
        description: "Could not add track to spotlights",
        variant: "destructive",
      })
    }
  }

  const handleRemoveSpotlight = async (spotlightToRemove) => {
    try {
      const updatedSpotlights = spotlights.filter(s => s.id !== spotlightToRemove.id)
      
      const response = await destroy(`/spotlight.json?id=${spotlightToRemove.id}`)

      if (response.ok) {
        setSpotlights(updatedSpotlights)
        toast({
          title: "Success",
          description: "Track removed from spotlights",
        })
      }
    } catch (error) {
      console.error('Error removing spotlight:', error)
      toast({
        title: "Error",
        description: "Could not remove track from spotlights",
        variant: "destructive",
      })
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setSpotlights((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update positions on the server
        const formData = {
          form_models_spotlight_form: {
            items_attributes: newItems.reduce((acc, spotlight, index) => ({
              ...acc,
              [index]: {
                _destroy: false,
                id: spotlight.id,
                spotlightable_type: 'Track',
                spotlightable_id: spotlight.track.id,
                position: index + 1
              }
            }), {})
          }
        }

        post(`/spotlight`, { body: formData }).catch((error) => {
          console.error('Error updating positions:', error)
          toast({
            title: "Error",
            description: "Could not update positions",
            variant: "destructive",
          })
        })

        return newItems
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {I18n.t('tracks.spotlights', { msg: `${spotlights.length}/12` })}
        </h2>
        {
          currentUser && currentUser.username === username && (
          <Button

            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Done' : 'Edit Spotlights'}
          </Button>
        )}
      </div>

      {isEditing && (
        <Select
          className="basic-single"
          classNamePrefix="select"
          placeholder="Select a track or Playlist from your profile"
          isClearable
          isSearchable
          defaultOptions
          loadOptions={loadTrackOptions}
          onChange={handleAddSpotlight}
          noOptionsMessage={() => "No tracks found"}
          theme={(theme) => selectTheme(theme, isDarkMode)}
          components={{ Option: CustomOption }}
        />
      )}

      {isEditing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={spotlights.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4 mt-4">
              {spotlights.map((spotlight) => (
                <SortableSpotlightItem
                  key={spotlight.id}
                  spotlight={spotlight}
                  onRemove={handleRemoveSpotlight}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <>
          {spotlights.map((spotlight) => (
          
            <TrackItem
              key={spotlight.track.id}
              track={spotlight.track}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onPlay={handlePlay}
            />

          ))}
        </>
      )}
    </div>
  )
}
