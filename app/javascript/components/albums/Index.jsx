import React, { useState } from 'react'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { motion } from 'framer-motion'
import PlaylistCard from '../playlists/PlaylistCard'
import I18n from '@/stores/locales'

const ALBUM_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'album', label: 'Albums' },
  { id: 'ep', label: 'EPs' },
  // { id: 'single', label: 'Singles' }
]

export default function AlbumsIndex() {
  const [selectedType, setSelectedType] = useState('all')
  
  const {
    items: albums,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/playlists.json?type=${selectedType === 'all' ? '' : selectedType}`)

  if (loading && albums.length === 0) {
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
          {I18n.t('albums.title')}
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          {I18n.t('albums.description')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {ALBUM_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type.id
                ? 'bg-brand-600 text-default'
                : 'bg-black/20 text-gray-300 hover:bg-black/30'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((album, index) => (
          <motion.div
            key={album.id}
            ref={index === albums.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <PlaylistCard playlist={album} />
          </motion.div>
        ))}
      </div>

      {loading && albums.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {albums.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">{I18n.t('albums.no_albums')}</p>
        </div>
      )}
    </div>
  )
}
