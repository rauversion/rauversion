import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CATEGORIES = ['Playlist', 'Album', 'Ep', 'Single', 'Compilation']

export default function UserAlbums() {
  const { username } = useParams()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([])

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await get(`/${username}/playlists_filter.json?kind=${selectedCategories.join(',')}`)
        if (response.ok) {
          const data = await response.json
          setAlbums(data.collection)
          setPagination(data.metadata)
        }
      } catch (error) {
        console.error('Error fetching albums:', error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedCategories.length > 0) {
      fetchAlbums()
    } else {
      // Fetch all albums when no category is selected
      const fetchAllAlbums = async () => {
        try {
          const response = await get(`/${username}/albums.json`)
          if (response.ok) {
            const data = await response.json
            setAlbums(data.collection)
            setPagination(data.metadata)
          }
        } catch (error) {
          console.error('Error fetching albums:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchAllAlbums()
    }
  }, [username, selectedCategories])

  const toggleCategory = (category) => {
    setLoading(true)
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      } else {
        return [category] // Only allow one category at a time
      }
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {albums.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-md font-medium text-gray-500">Albums</h2>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCategory(category.toLowerCase())}
                  className={cn(
                    "rounded-full",
                    selectedCategories.includes(category.toLowerCase()) && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>


          <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {albums.map((album) => (
              <li key={album.id} className="col-span-1 flex rounded-md shadow-sm">
                <div className="flex w-16 flex-shrink-0 items-center justify-center bg-pink-600 rounded-l-md text-sm font-medium text-white">
                  <img
                    src={album.cover_url.medium}
                    alt={album.title}
                    className="object-center object-cover group-hover:opacity-75"
                  />
                </div>
                <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-muted bg-card">
                  <div className="flex-1 truncate px-4 py-2 text-sm">
                    <Link
                      to={`/playlists/${album.slug}`}
                      className="font-medium text-gray-300 hover:text-white"
                    >
                      {album.title}
                    </Link>
                    <p className="text-gray-500">
                      {album.release_date && new Date(album.release_date).getFullYear()} ·{' '}
                      {album.tracks_count} Tracks
                    </p>
                  </div>
                  <div className="flex-shrink-0 pr-2">
                    <button
                      type="button"
                      onClick={() => console.log('Play album:', album.title)}
                      className="hidden inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-gray-400 hover:text-white hover:bg-brand-700"
                    >
                      <span className="sr-only">Play album</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
        )
      }

      {/*albums.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No albums found</p>
        </div>
      )*/}
    </div>
  )
}
