import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'

export default function UserArtists() {
  const { username } = useParams()
  const [artists, setArtists] = useState([])
  const [label, setLabel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await get(`/${username}/artists.json`)
        if (response.ok) {
          const data = await response.json
          setArtists(data.artists)
          setLabel(data.label)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching artists:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArtists()
  }, [username])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      {label && (
        <div className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg">
          <img
            src={label.avatar_url.medium}
            alt={label.username}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h2 className="text-xl font-semibold">{label.first_name} {label.last_name}</h2>
            <p className="text-gray-400">@{label.username}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            to={`/${artist.username}`}
            className="group"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-900 rounded-lg">
              <img
                src={artist.avatar_url.medium}
                alt={artist.username}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200" />
            </div>
            <div className="mt-3">
              <h3 className="font-medium group-hover:text-primary-500 transition-colors duration-200">
                {artist.first_name} {artist.last_name}
              </h3>
              <p className="text-sm text-gray-400">@{artist.username}</p>
              <p className="text-sm text-gray-400 mt-1">
                {artist.tracks_count} tracks
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      {artists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No artists found</p>
        </div>
      )}
    </div>
  )
}
