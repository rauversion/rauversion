import React from 'react'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { motion } from 'framer-motion'
import UserCard from '../shared/userCard'
import I18n from '@/stores/locales'

export default function ArtistsIndex() {
  const {
    items: artists,
    loading,
    lastElementRef
  } = useInfiniteScroll('/artists.json')

  if (loading && artists.length === 0) {
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
          {I18n.t('artists.title')}
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          {I18n.t('artists.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id}
            ref={index === artists.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <UserCard artist={artist} />
          </motion.div>
        ))}
      </div>

      {loading && artists.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {artists.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">{I18n.t('artists.no_artists')}</p>
        </div>
      )}
    </div>
  )
}
