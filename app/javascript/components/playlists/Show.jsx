import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import useAudioStore from '../../stores/audioStore'
import useAuthStore from '../../stores/authStore'
import { format } from 'date-fns'
import { Play, Pause, Settings, ShoppingCart } from 'lucide-react'
import PlaylistEdit from './PlaylistEdit'
import { Button } from "@/components/ui/button"
import { ShareDialog } from "@/components/ui/share-dialog"
import { Comments } from "@/components/comments/Comments"
import MusicPurchase from '@/components/shared/MusicPurchase'


export default function PlaylistShow() {
  const { slug } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const { 
    currentTrackId, 
    isPlaying, 
    audioPlaying,
    play,
    pause,
    setPlaylist: setAudioPlaylist,
    formatTime,
    addMultipleToPlaylist
  } = useAudioStore()
  const { currentUser } = useAuthStore()
  const accentColor = '#1DB954' // Spotify-like accent color
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

  useEffect(() => {
    if(playlist && playlist.tracks) { 
      addMultipleToPlaylist(playlist.tracks)
    }
  }, [playlist])

  useEffect(() => {
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
      pause()
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-neutral-400">
                  <Link 
                    to={`/${playlist.user.username}`}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <img 
                      src={playlist.user.avatar_url?.small} 
                      alt={playlist.user.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{playlist.user.username}</span>
                  </Link>
                  <span className="hidden sm:block">•</span>
                  <span>
                    {format(new Date(playlist.release_date || new Date()), 'MMM dd')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => isPlaying && currentTrackId === playlist.tracks[0]?.id ? pause() : handlePlay()}
                  className="bg-brand-500 hover:bg-brand-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: accentColor }}
                >
                  {isPlaying && playlist.tracks?.find((o)=> o.id === currentTrackId) ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>

                <div className="flex flex-wrap gap-2">
                  {currentUser?.id === playlist.user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditOpen(true)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  )}

                  <ShareDialog 
                    url={`${window.location.origin}/${playlist.user.username}/playlists/${playlist.slug}`}
                    title={playlist.title}
                    description={`Listen to ${playlist.title} by ${playlist.user.username} on Rauversion`}
                  >
                    <button className="hover:bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </ShareDialog>

                  <button className="hover:bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span className="hidden sm:inline">3 Me gusta</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Description Section */}
      {playlist.description && (
        <div className="max-w-7xl mx-auto px-8 pb-4">
          <div className="text-gray-400 text-lg whitespace-pre-wrap">
            {playlist.description}
          </div>
        </div>
      )}

      {/* Tracks Section */}
      <div className="max-w-7xl mx-auto p-8 pt-4">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold mb-4">Tracks</h2>
          <MusicPurchase resource={playlist} type="Playlist" variant="mini" />
        </div>

        <div className="space-y-2">
          {playlist.tracks.map((track, index) => (
            <div 
              key={track.id}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 rounded hover:bg-white hover:bg-opacity-10 group ${
                currentTrackId === track.id ? 'bg-white bg-opacity-20' : ''
              }`}
            >
              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                <span className={`hidden sm:block w-6 ${currentTrackId === track.id ? `text-[${accentColor}]` : 'text-zinc-400'}`}>
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

                <div className="min-w-0 flex-1">
                  <p className={`font-medium truncate ${
                    currentTrackId === track.id ? `text-[${accentColor}]` : 'text-white'
                  }`}>
                    {track.title}
                  </p>
                  <p className="text-zinc-400 text-sm truncate">{track.author?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-10 sm:ml-0">
                {track.duration && track.duration !== "xx:xx" && (
                  <span className="text-zinc-400 text-sm">
                    {formatTime(track.duration)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-7xl mx-auto p-8 border-t border-white/10">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
        </div>
        
        <Comments 
          resourceType="playlist" 
          resourceId={playlist.slug} 
        />
      </div>

      {playlist && currentUser?.id === playlist.user.id && (
        <PlaylistEdit
          playlist={playlist}
          open={editOpen}
          onOpenChange={setEditOpen}
          onOk={fetchPlaylist}
        />
      )}
    </div>
  )
}
