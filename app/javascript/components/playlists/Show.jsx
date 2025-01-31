import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import useAudioStore from '../../stores/audioStore'
import useAuthStore from '../../stores/authStore'
import { format } from 'date-fns'
import { Play, Pause } from 'lucide-react'

export default function PlaylistShow() {
  const { slug } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const { 
    currentTrackId, 
    isPlaying, 
    audioPlaying,
    play,
    pause,
    setPlaylist: setAudioPlaylist,
    formatTime
  } = useAudioStore()
  const { currentUser } = useAuthStore()
  const accentColor = '#1DB954' // Spotify-like accent color

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await get(`/playlists/${slug}.json`)
        if (response.ok) {
          const data = await response.json
          setPlaylist(data.playlist)
          // Set the playlist in the audio store
          setAudioPlaylist(data.playlist.tracks)
        }
      } catch (error) {
        console.error('Error fetching playlist:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylist()
  }, [slug, setAudioPlaylist])

  const handlePlay = () => {
    if (playlist?.tracks?.[0]) {
      play(playlist.tracks[0].id)
    }
  }

  const handleTrackPlay = (trackId) => {
    if (currentTrackId === trackId && isPlaying) {
      pause()
    } else {
      play(trackId)
    }
  }

  if (loading || !playlist) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-neutral-800 to-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Art */}
            <div className="w-full md:w-[340px] flex-shrink-0">
              <img
                src={playlist.cover_url.large}
                alt={playlist.title}
                className="w-full aspect-square object-cover shadow-lg"
              />
            </div>

            {/* Playlist Info */}
            <div className="flex-grow">
              <div className="mb-6">
                <h2 className="text-sm uppercase text-neutral-400 mb-2">
                  {playlist.playlist_type}
                </h2>
                <h1 className="text-4xl font-bold mb-2">{playlist.title}</h1>
                <p className="text-neutral-400">
                  {format(new Date(playlist.release_date || new Date()), 'MMM dd')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlay}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-2 rounded-full flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                  </svg>
                  Play
                </button>

                <button className="hover:bg-white/10 border border-white/20 text-white px-6 py-2 rounded-full flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                  Share
                </button>

                <button className="hover:bg-white/10 border border-white/20 text-white px-6 py-2 rounded-full flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>3 Me gusta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks Section */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Tracks</h2>
        </div>

        <div className="space-y-2">
          {playlist.tracks.map((track, index) => (
            <div 
              key={track.id}
              className={`flex items-center justify-between p-2 rounded hover:bg-white hover:bg-opacity-10 group ${
                currentTrackId === track.id ? 'bg-white bg-opacity-20' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-6 ${currentTrackId === track.id ? `text-[${accentColor}]` : 'text-zinc-400'}`}>
                  {index + 1}
                </span>
                
                <button 
                  onClick={() => handleTrackPlay(track.id)}
                  className="cursor-pointer focus:outline-none"
                >
                  {currentTrackId === track.id && isPlaying ? 
                    <Pause size={20} /> : 
                    <Play size={20} />
                  }
                </button>

                <div>
                  <p className={`font-medium ${
                    currentTrackId === track.id ? `text-[${accentColor}]` : 'text-white'
                  }`}>
                    {track.title}
                  </p>
                  <p className="text-zinc-400 text-sm">{track.author?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {track.duration && track.duration !== "xx:xx" && (
                  <span className="text-zinc-400">
                    {formatTime(track.duration)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
