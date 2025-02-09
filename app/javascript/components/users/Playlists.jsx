import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import useAudioStore from '../../stores/audioStore'
import { Play, Pause } from 'lucide-react'
import MusicPurchase from '../shared/MusicPurchase'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import PlaylistListItem from './PlaylistItem'

export default function UserPlaylists({ namespace = 'playlists' }) {
  const { username } = useParams()
  const { 
    currentTrackId, 
    isPlaying, 
    play,
    pause,
    setPlaylist
  } = useAudioStore()

  const {
    items: playlists,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/${namespace}.json`)

  const handlePlayTrack = (track, playlist) => {
    if (currentTrackId === track.id) {
      if (isPlaying) {
        pause()
      } else {
        play(track.id)
      }
    } else {
      setPlaylist(playlist.tracks)
      play(track.id)
    }
  }

  const handlePlayPlaylist = (playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setPlaylist(playlist.tracks)
      play(playlist.tracks[0].id)
    }
  }

  return (
    <div>
      {playlists.map((playlist, index) => {
        if (playlists.length === index + 1) {
          return (
            <div ref={lastElementRef} key={playlist.id} className="my-2 p-2 border-- rounded-md shadow-xs mx-3">
              <div className="flex space-x-3">
                <div className="w-48 relative group">
                  <img
                    src={playlist.cover_url.medium}
                    alt={playlist.title}
                    className="object-center object-cover group-hover:opacity-75"
                  />
                  <button
                    onClick={() => handlePlayPlaylist(playlist)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity"
                  >
                    {isPlaying && playlist.tracks?.some(track => track.id === currentTrackId) ? (
                      <Pause className="w-12 h-12 text-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white" />
                    )}
                  </button>
                </div>

                <div className="flex-grow">
                  <div className="flex flex-col">
                    <div className="space-y-2 flex flex-col">
                      <div className="flex justify-between">
                        <h3 className="flex items-center space-x-2 mt-3- text-xl font-extrabold tracking-tight text-gray-200">
                          <Link to={`/playlists/${playlist.slug}`}>
                            {playlist.title}
                          </Link>

                          {playlist.playlist_type === 'album' && playlist.release_date && (
                            <span className="text-xs text-gray-400 font-thin">
                              Album {new Date(playlist.release_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </h3>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePlayPlaylist(playlist)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                          >
                            {isPlaying && playlist.tracks?.some(track => track.id === currentTrackId) ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Play
                              </>
                            )}
                          </button>

                          {playlist.private && (
                            <div className="mr-2">
                              <div className="bg-brand-500 text-white text-xs p-1 rounded-md inline-flex space-x-1 items-center">
                                <svg
                                  viewBox="0 0 15 15"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="15"
                                  height="15"
                                >
                                  <path
                                    d="M5.5 7h4V6h-4v1zm4.5.5v3h1v-3h-1zM9.5 11h-4v1h4v-1zM5 10.5v-3H4v3h1zm.5.5a.5.5 0 01-.5-.5H4A1.5 1.5 0 005.5 12v-1zm4.5-.5a.5.5 0 01-.5.5v1a1.5 1.5 0 001.5-1.5h-1zM9.5 7a.5.5 0 01.5.5h1A1.5 1.5 0 009.5 6v1zm-4-1A1.5 1.5 0 004 7.5h1a.5.5 0 01.5-.5V6zm.5.5v-1H5v1h1zm3-1v1h1v-1H9zM7.5 4A1.5 1.5 0 019 5.5h1A2.5 2.5 0 007.5 3v1zM6 5.5A1.5 1.5 0 017.5 4V3A2.5 2.5 0 005 5.5h1z"
                                    fill="currentColor"
                                  />
                                </svg>
                                <span>Private</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {playlist.description && (
                        <div className="text-gray-400 text-sm truncate max-w-2xl">
                          {playlist.description}
                        </div>
                      )}

                      <div className="text-gray-400 text-sm">
                        {playlist.tracks_count} tracks
                      </div>

                      {/* Tracks List */}
                      <div className="mt-8">
                        <div className="space-y-1 bg-black/5 p-4 rounded-lg">
                          {playlist.tracks?.map((track, index) => (
                            <PlaylistListItem
                              key={track.id}
                              track={track}
                              index={index}
                              currentTrackId={currentTrackId}
                              isPlaying={isPlaying}
                              onPlay={() => handlePlayTrack(track, playlist)}
                            />
                          ))}
                          <div className="mt-4 flex justify-end">
                            <MusicPurchase 
                              resource={playlist}
                              type="Playlist"
                              variant="mini"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        } else {
          return (
            <div key={playlist.id} className="my-2 p-2 border-- rounded-md shadow-xs mx-3">
              <div className="flex space-x-3">
                <div className="w-48 relative group">
                  <img
                    src={playlist.cover_url.medium}
                    alt={playlist.title}
                    className="object-center object-cover group-hover:opacity-75"
                  />
                  <button
                    onClick={() => handlePlayPlaylist(playlist)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity"
                  >
                    {isPlaying && playlist.tracks?.some(track => track.id === currentTrackId) ? (
                      <Pause className="w-12 h-12 text-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white" />
                    )}
                  </button>
                </div>

                <div className="flex-grow">
                  <div className="flex flex-col">
                    <div className="space-y-2 flex flex-col">
                      <div className="flex justify-between">
                        <h3 className="flex items-center space-x-2 mt-3- text-xl font-extrabold tracking-tight text-gray-200">
                          <Link to={`/playlists/${playlist.slug}`}>
                            {playlist.title}
                          </Link>

                          {playlist.playlist_type === 'album' && playlist.release_date && (
                            <span className="text-xs text-gray-400 font-thin">
                              Album {new Date(playlist.release_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </h3>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePlayPlaylist(playlist)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                          >
                            {isPlaying && playlist.tracks?.some(track => track.id === currentTrackId) ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Play
                              </>
                            )}
                          </button>

                          {playlist.private && (
                            <div className="mr-2">
                              <div className="bg-brand-500 text-white text-xs p-1 rounded-md inline-flex space-x-1 items-center">
                                <svg
                                  viewBox="0 0 15 15"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="15"
                                  height="15"
                                >
                                  <path
                                    d="M5.5 7h4V6h-4v1zm4.5.5v3h1v-3h-1zM9.5 11h-4v1h4v-1zM5 10.5v-3H4v3h1zm.5.5a.5.5 0 01-.5-.5H4A1.5 1.5 0 005.5 12v-1zm4.5-.5a.5.5 0 01-.5.5v1a1.5 1.5 0 001.5-1.5h-1zM9.5 7a.5.5 0 01.5.5h1A1.5 1.5 0 009.5 6v1zm-4-1A1.5 1.5 0 004 7.5h1a.5.5 0 01.5-.5V6zm.5.5v-1H5v1h1zm3-1v1h1v-1H9zM7.5 4A1.5 1.5 0 019 5.5h1A2.5 2.5 0 007.5 3v1zM6 5.5A1.5 1.5 0 017.5 4V3A2.5 2.5 0 005 5.5h1z"
                                    fill="currentColor"
                                  />
                                </svg>
                                <span>Private</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {playlist.description && (
                        <div className="text-gray-400 text-sm truncate max-w-2xl">
                          {playlist.description}
                        </div>
                      )}

                      <div className="text-gray-400 text-sm">
                        {playlist.tracks_count} tracks
                      </div>

                      {/* Tracks List */}
                      <div className="mt-8">
                        <div className="space-y-1 bg-black/5 p-4 rounded-lg">
                          {playlist.tracks?.map((track, index) => (
                            <PlaylistListItem
                              key={track.id}
                              track={track}
                              index={index}
                              currentTrackId={currentTrackId}
                              isPlaying={isPlaying}
                              onPlay={() => handlePlayTrack(track, playlist)}
                            />
                          ))}
                          <div className="mt-4 flex justify-end">
                            <MusicPurchase 
                              resource={playlist}
                              type="Playlist"
                              variant="mini"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      })}

      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {playlists.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">No {namespace} found</p>
        </div>
      )}
    </div>
  )
}
