import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '@rails/request.js'
import { Disc3 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  PlaylistShowcaseCard,
  PlaylistShowcaseSkeleton,
  playlistTypeLabel,
} from '@/components/playlists/PlaylistShowcaseCard'

const CATEGORIES = ['playlist', 'album', 'ep', 'single', 'compilation']

function discographyText(key, options = {}) {
  return I18n.t(`users.artist_page.discography.${key}`, options)
}

export default function UserAlbums() {
  const { username } = useParams()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchAlbums = async () => {
      setLoading(true)

      const url = selectedCategory
        ? `/${username}/playlists_filter.json?kind=${selectedCategory}`
        : `/${username}/albums.json`

      try {
        const response = await get(url)
        if (!response.ok) return

        const data = await response.json
        if (!cancelled) {
          setAlbums(Array.isArray(data.collection) ? data.collection : [])
        }
      } catch (error) {
        console.error('Error fetching albums:', error)
        if (!cancelled) {
          setAlbums([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAlbums()

    return () => {
      cancelled = true
    }
  }, [username, selectedCategory])

  const toggleCategory = (category) => {
    setSelectedCategory((current) => (current === category ? null : category))
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-400">
            <Disc3 className="h-3.5 w-3.5" />
            {discographyText("badge")}
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {discographyText("title")}
          </h2>
          <p className="hidden mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {discographyText("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              onClick={() => toggleCategory(category)}
              className={cn(
                "rounded-full border-border/70 bg-background/80 px-4 capitalize text-muted-foreground shadow-sm transition",
                "hover:border-brand-400 hover:text-foreground",
                selectedCategory === category && "border-brand-500 bg-brand-500 text-white hover:bg-brand-500 hover:text-white"
              )}
            >
              {playlistTypeLabel(category)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((placeholder) => (
            <PlaylistShowcaseSkeleton key={placeholder} />
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {albums.map((album, index) => (
            <PlaylistShowcaseCard
              key={album.id}
              playlist={album}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-border bg-black/5 px-6 py-12 text-center dark:bg-white/5">
          <p className="text-base font-medium text-foreground">{discographyText("empty_title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {discographyText("empty_description")}
          </p>
        </div>
      )}
    </section>
  )
}
