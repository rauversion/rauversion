import React from 'react'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { motion } from 'framer-motion'
import UserCard from '../shared/userCard'
import I18n from '@/stores/locales'

function ArtistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card/95 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 rounded-[24px] bg-muted/70" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted/60" />
            <div className="h-6 w-16 rounded-full bg-muted/50" />
          </div>
          <div className="h-6 w-2/3 rounded-full bg-muted/70" />
          <div className="h-4 w-24 rounded-full bg-muted/50" />
          <div className="h-6 w-28 rounded-full bg-muted/50" />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-4 w-full rounded-full bg-muted/50" />
        <div className="h-4 w-11/12 rounded-full bg-muted/50" />
        <div className="h-4 w-4/5 rounded-full bg-muted/40" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-10 rounded-full bg-muted/50" />
        <div className="h-10 rounded-full bg-muted/50" />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-5">
        <div className="h-3 w-24 rounded-full bg-muted/50" />
        <div className="h-9 w-24 rounded-full bg-muted/60" />
      </div>
    </div>
  )
}

export default function ArtistsIndex() {
  const {
    items: artists,
    loading,
    lastElementRef
  } = useInfiniteScroll('/artists.json')
  const showInitialSkeletons = loading && artists.length === 0
  const showLoadingMoreSkeletons = loading && artists.length > 0

  return (
    <div className="@container/artists-page mx-auto max-w-7xl px-4 py-8 @sm/artists-page:px-6 @lg/artists-page:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white @3xl/artists-page:text-4xl">
          {I18n.t('artists.title')}
        </h1>
        <p className="mt-2 text-base text-muted-foreground @3xl/artists-page:text-lg">
          {I18n.t('artists.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 @4xl/artists-page:grid-cols-2 @6xl/artists-page:grid-cols-3">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id}
            className="h-full"
            ref={index === artists.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <UserCard artist={artist} variant="rounded" />
          </motion.div>
        ))}

        {showInitialSkeletons && Array.from({ length: 6 }).map((_, index) => (
          <ArtistCardSkeleton key={`artist-skeleton-${index}`} />
        ))}
      </div>

      {showLoadingMoreSkeletons && (
        <div className="mt-6 grid grid-cols-1 gap-5 @4xl/artists-page:grid-cols-2 @6xl/artists-page:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <ArtistCardSkeleton key={`artist-loading-more-${index}`} />
          ))}
        </div>
      )}

      {artists.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{I18n.t('artists.no_artists')}</p>
        </div>
      )}
    </div>
  )
}
