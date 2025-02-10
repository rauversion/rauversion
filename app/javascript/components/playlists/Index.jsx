import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PlaylistCard from './PlaylistCard'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import I18n from '@/stores/locales'

const PLAYLIST_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'playlist', label: 'Playlists' },
  { id: 'album', label: 'Albums' },
  { id: 'ep', label: 'EPs' },
  { id: 'demo', label: 'Demos' }
]

export default function PlaylistsIndex() {
  const [selectedType, setSelectedType] = useState('all')
  
  const {
    items: playlists,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/playlists.json${selectedType !== 'all' ? `?type=${selectedType}` : ''}`)

  if (loading && playlists.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('loading')}></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {I18n.t('playlists.title')}
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          {I18n.t('playlists.description')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {PLAYLIST_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type.id
                ? 'bg-brand-600 text-white'
                : 'bg-black/20 text-gray-300 hover:bg-black/30'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            ref={index === playlists.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={`/playlists/${playlist.slug}`} className="block">
              <PlaylistCard playlist={playlist} />
            </Link>
          </motion.div>
        ))}
      </div>

      {loading && playlists.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {playlists.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">{I18n.t('playlists.no_playlists')}</p>
        </div>
      )}
    </div>
  )
}
