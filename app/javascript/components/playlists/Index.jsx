import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import I18n from '@/stores/locales'
import {
  PlaylistShowcaseCard,
  PlaylistShowcaseSkeleton,
} from '@/components/playlists/PlaylistShowcaseCard'

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
  const showInitialSkeletons = loading && playlists.length === 0
  const showLoadingMoreSkeletons = loading && playlists.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {I18n.t('playlists.title')}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
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
                : 'bg-black/20 text-muted-foreground hover:bg-black/30'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {playlists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            className="h-full"
            ref={index === playlists.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <PlaylistShowcaseCard playlist={playlist} />
          </motion.div>
        ))}

        {showInitialSkeletons && Array.from({ length: 6 }).map((_, index) => (
          <PlaylistShowcaseSkeleton key={`playlist-skeleton-${index}`} />
        ))}
      </div>

      {showLoadingMoreSkeletons && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <PlaylistShowcaseSkeleton key={`playlist-loading-more-${index}`} />
          ))}
        </div>
      )}

      {playlists.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{I18n.t('playlists.no_playlists')}</p>
        </div>
      )}
    </div>
  )
}
