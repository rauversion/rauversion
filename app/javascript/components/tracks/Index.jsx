import React, { useEffect, useState } from 'react'
import { get } from '@rails/request.js'
import { Link } from 'react-router-dom'
import TrackCell from './TrackCell'
import UserCard from '../users/UserCard'
import PlaylistCard from '../playlists/PlaylistCard'
import LabelCard from '../labels/LabelCard'
import { truncate } from '../../utils/text'

export default function TracksIndex() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlightedPlaylist, setHighlightedPlaylist] = useState(null)
  const [artists, setArtists] = useState([])
  const [featuredAlbums, setFeaturedAlbums] = useState([])
  const [curatedPlaylists, setCuratedPlaylists] = useState([])
  const [labels, setLabels] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await get('/tracks.json')
        if (response.ok) {
          const data = await response.json
          setTracks(data.tracks)
          setHighlightedPlaylist(data.highlighted_playlist)
          setArtists(data.artists)
          setFeaturedAlbums(data.featured_albums)
          setCuratedPlaylists(data.curated_playlists)
          setLabels(data.labels)
          setPopularTags(data.popular_tags)
        }
      } catch (error) {
        console.error('Error loading tracks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-default text-default">
      {highlightedPlaylist && (
        <section className="relative h-[70vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${highlightedPlaylist.cover_url.medium}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          </div>
          <div className="relative h-full px-4 sm:px-8">
            <div className="max-w-6xl mx-auto h-full flex items-end pb-12 md:pb-24">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full mb-4">
                  New Release
                </span>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {highlightedPlaylist.title}
                </h1>
                <p className="text-2xl text-gray-300 mb-6">
                  {truncate(highlightedPlaylist.description, 100)}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/playlists/${highlightedPlaylist.slug}`}
                    className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    View Album
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Discover Music</h1>
          
          <div className="flex flex-wrap gap-3 my-4">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedTag
                  ? 'bg-primary text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              All
            </button>
            {popularTags.map((tag) => (
              <button
                key={tag.tag}
                onClick={() => setSelectedTag(tag.tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag.tag
                    ? 'bg-primary text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                {tag.tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tracks
              .filter((track) =>
                selectedTag ? track.tags?.includes(selectedTag) : true
              )
              .map((track) => (
                <TrackCell key={track.id} track={track} />
              ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Featured Artists
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            {artists.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-12 md:py-24 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Featured Albums
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {featuredAlbums.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Curated Playlists
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {curatedPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-12 md:py-24 bg-default">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Featured Labels
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {labels.map((label) => (
              <LabelCard key={label.id} label={label} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
