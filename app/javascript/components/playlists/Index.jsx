import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PlaylistCard from './PlaylistCard'
import { get } from '@rails/request.js'

const PLAYLIST_TYPES = ['album', 'ep', 'playlist', 'demo']

export default function PlaylistsIndex() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await get('/playlists.json')
        if (response.ok) {
          const data = await response.json
          setPlaylists(data.playlists)
        }
      } catch (error) {
        console.error('Error fetching playlists:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  const playlistsByType = PLAYLIST_TYPES.reduce((acc, type) => {
    acc[type] = playlists.filter(playlist => playlist.playlist_type === type)
    return acc
  }, {})

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4">
      {PLAYLIST_TYPES.map(type => {
        const typeItems = playlistsByType[type]
        if (!typeItems?.length) return null

        return (
          <section key={type} className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 capitalize">
              {type === 'ep' ? 'EP' : type}s
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {typeItems.map(playlist => (
                <Link 
                  key={playlist.id} 
                  to={`/playlists/${playlist.slug}`}
                  className="block"
                >
                  <PlaylistCard playlist={playlist} />
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
