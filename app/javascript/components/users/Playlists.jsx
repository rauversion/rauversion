import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'

export default function UserPlaylists() {
  const { username } = useParams()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await get(`/${username}/playlists.json`)
        if (response.ok) {
          const data = await response.json
          setPlaylists(data.playlists)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching playlists:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [username])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {playlists.map((playlist) => (
        <Link
          key={playlist.id}
          to={`/playlists/${playlist.slug}`}
          className="group"
        >
          <div className="aspect-square relative overflow-hidden bg-gray-900 rounded-lg">
            <img
              src={playlist.cover_url.medium}
              alt={playlist.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200" />
          </div>
          <div className="mt-2">
            <h3 className="font-medium truncate">{playlist.title}</h3>
            <p className="text-sm text-gray-400 truncate">
              {playlist.tracks_count} tracks
            </p>
          </div>
        </Link>
      ))}
      
      {playlists.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-400">No playlists found</p>
        </div>
      )}
    </div>
  )
}
