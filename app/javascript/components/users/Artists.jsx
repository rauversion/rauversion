import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function UserArtists() {
  const { username } = useParams()
  const [label, setLabel] = useState(null)

  const {
    items: artists,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/artists.json`, (data) => {
    if (!label && data.label) {
      setLabel(data.label)
    }
  })

  if (loading && artists.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {label && (
        <div className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg">
          <img
            src={label.avatar_url.medium}
            alt={label.username}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-semibold">{label.full_name}</h2>
            <p className="text-gray-400">@{label.username}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist, index) => (
          <div
            key={artist.id}
            ref={index === artists.length - 1 ? lastElementRef : null}
            className="flex flex-col items-center p-6 bg-gray-800 rounded-lg"
          >
            {artist.avatar_url ? (
              <img
                src={artist.avatar_url.medium}
                alt={artist.username}
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-400">
                  {artist.username[0].toUpperCase()}
                </span>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-1">{artist.full_name}</h3>
            <p className="text-gray-400 text-sm mb-4">@{artist.username}</p>

            <div className="flex space-x-4 text-sm text-gray-400">
              <div>
                <span className="font-semibold text-default">{artist.tracks_count}</span> tracks
              </div>
              <div>
                <span className="font-semibold text-default">{artist.albums_count}</span> albums
              </div>
            </div>

            {artist.bio && (
              <p className="mt-4 text-sm text-gray-400 text-center line-clamp-3">
                {artist.bio}
              </p>
            )}

            <Link
              to={`/${artist.username}`}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-500 transition-colors"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {loading && artists.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}
    </div>
  )
}
