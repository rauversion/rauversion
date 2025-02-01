import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'

export default function UserAlbums() {
  const { username } = useParams()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await get(`/${username}/albums.json`)
        if (response.ok) {
          const data = await response.json
          setAlbums(data.playlists)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching albums:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlbums()
  }, [username])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {albums.map((album) => (
        <Link
          key={album.id}
          to={`/playlists/${album.slug}`}
          className="group"
        >
          <div className="aspect-square relative overflow-hidden bg-gray-900 rounded-lg">
            <img
              src={album.cover_url.medium}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200" />
          </div>
          <div className="mt-3">
            <h3 className="font-medium group-hover:text-primary-500 transition-colors duration-200">
              {album.title}
            </h3>
            <p className="text-sm text-gray-400">
              {album.tracks_count} tracks
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Released {new Date(album.created_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
      
      {albums.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-400">No albums found</p>
        </div>
      )}
    </div>
  )
}
