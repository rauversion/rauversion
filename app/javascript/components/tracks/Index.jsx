import React, { useEffect, useState } from 'react'
import { get } from '@rails/request.js'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MinimalTrackCell } from './TrackCell'
import FeaturedArtists from '../home/FeaturedArtists'
import PlaylistCard from '../playlists/PlaylistCard'
import LabelCard from '../labels/LabelCard'
import { truncate } from '../../utils/text'
import { Skeleton } from '../ui/skeleton'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import I18n from '@/stores/locales'

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Skeleton */}
      <div className="h-[70vh] relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent animate-pulse" />
        <div className="relative h-full px-4 sm:px-8">
          <div className="max-w-6xl mx-auto h-full flex items-end pb-12 md:pb-24">
            <div className="max-w-2xl space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="flex flex-wrap gap-3 my-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [tagLoading, setTagLoading] = useState(false)

  const fetchTracks = async (tag = null) => {
    setTagLoading(true)
    try {
      const url = tag ? `/tracks.json?tag=${tag}` : '/tracks.json'
      const response = await get(url)
      if (response.ok) {
        const data = await response.json
        setTracks(data.tracks)
        setHighlightedPlaylist(data.highlighted_playlist)
        setArtists(data.artists)
        setFeaturedAlbums(data.featured_albums)
        setCuratedPlaylists(data.curated_playlists)
        setLabels(data.labels)
        if (!tag) {
          setPopularTags(data.popular_tags)
        }
      }
    } catch (error) {
      console.error('Error loading tracks:', error)
    } finally {
      setTagLoading(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks()
  }, [])

  const handleTagSelect = async (tag) => {
    setSelectedTag(tag)
    await fetchTracks(tag)
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-black text-white">
      {highlightedPlaylist && (
        <section className="relative h-[70vh] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${highlightedPlaylist.cover_url.medium}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          </motion.div>
          <div className="relative h-full px-4 sm:px-8">
            <div className="max-w-6xl mx-auto h-full flex items-end pb-12 md:pb-24">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl"
              >
                <span className="inline-block px-3 py-1 bg-white/10 text-white text-sm font-mono rounded-full mb-4 border border-white/20">
                  {I18n.t('tracks.index.new_release')}
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 mix-blend-difference">
                  {highlightedPlaylist.title}
                </h1>
                <p className="text-2xl text-gray-300 mb-6 font-mono">
                  {truncate(highlightedPlaylist.description, 100)}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/playlists/${highlightedPlaylist.slug}`}
                    className="bg-white text-black hover:bg-white/90 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {I18n.t('tracks.index.view_album')}
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter mb-8"
          >
            {I18n.t('tracks.index.discover')}
          </motion.h1>
          
          <div className="flex flex-wrap gap-3 my-8">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTagSelect(null)}
              className={`px-6 py-3 rounded-lg text-sm font-mono border transition-colors ${
                !selectedTag
                  ? 'bg-white text-black border-white'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {I18n.t('tracks.index.all')}
            </motion.button>
            {popularTags.map((tag, index) => (
              <motion.button
                key={tag.tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTagSelect(tag.tag)}
                className={`px-6 py-3 rounded-lg text-sm font-mono border transition-colors ${
                  selectedTag === tag.tag
                    ? 'bg-white text-black border-white'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {tag.tag}
              </motion.button>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 ${
              tagLoading ? 'opacity-50' : ''
            }`}
          >
            {tracks.map((track) => (
              <MinimalTrackCell key={track.id} track={track} />
            ))}
          </motion.div>
        </div>
      </section>

      <FeaturedArtists artists={artists} />

      <section className="py-16 md:py-24 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-8 flex justify-between items-center mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                {I18n.t('tracks.index.featured_albums.title')}
              </h2>
              <p className="text-lg text-gray-400">
                {I18n.t('tracks.index.featured_albums.subtitle')}
              </p>
            </motion.div>
            
            <Link to="/albums">
              <Button 
                variant="outline" 
                size="lg"
                className="group border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                {I18n.t('tracks.index.view_all')}
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </motion.svg>
              </Button>
            </Link>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              onClick={() => {
                const container = document.getElementById('albums-carousel')
                container.scrollBy({ left: -400, behavior: 'smooth' })
              }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: 'rotate(180deg)' }}
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </motion.svg>
            </Button>
            
            <div 
              id="albums-carousel"
              className="overflow-x-auto scrollbar-hide px-4 sm:px-8"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ staggerChildren: 0.1 }}
                className="flex space-x-6"
              >
                {featuredAlbums.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="group relative flex-shrink-0 w-[300px] md:w-[400px]"
                  >
                    <Link to={`/playlists/${playlist.slug}`}>
                      <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3]">
                        {/* Album Cover */}
                        <motion.div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${playlist.cover_url.medium})` }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.4 }}
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                        {/* Content */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-between">
                          {/* Top Section */}
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-between items-start"
                          >
              <Badge 
                variant="outline" 
                className="bg-black/50 text-white border-white/20"
              >
                {I18n.t('tracks.count', { count: playlist.tracks_count })}
              </Badge>
                          </motion.div>

                          {/* Bottom Section */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-4">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="bg-white rounded-full p-3 shadow-lg group"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="black"
                                  className="w-5 h-5 group-hover:fill-primary transition-colors"
                                >
                                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                </svg>
                              </motion.button>
                              <div>
                                <h3 className="text-2xl font-black tracking-tight text-white">
                                  {playlist.title}
                                </h3>
                                <p className="text-gray-300 font-medium">
                                  By {playlist.user.username}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              onClick={() => {
                const container = document.getElementById('albums-carousel')
                container.scrollBy({ left: 400, behavior: 'smooth' })
              }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </motion.svg>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-8 flex justify-between items-center mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                {I18n.t('tracks.index.curated_playlists.title')}
              </h2>
              <p className="text-lg text-gray-400">
                {I18n.t('tracks.index.curated_playlists.subtitle')}
              </p>
            </motion.div>
            
            <Link to="/playlists">
              <Button 
                variant="outline" 
                size="lg"
                className="group border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                {I18n.t('tracks.index.view_all')}
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </motion.svg>
              </Button>
            </Link>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              onClick={() => {
                const container = document.getElementById('playlists-carousel')
                container.scrollBy({ left: -400, behavior: 'smooth' })
              }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: 'rotate(180deg)' }}
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </motion.svg>
            </Button>
            
            <div 
              id="playlists-carousel"
              className="overflow-x-auto scrollbar-hide px-4 sm:px-8"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ staggerChildren: 0.1 }}
                className="flex space-x-6"
              >
                {curatedPlaylists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="group relative flex-shrink-0 w-[300px] md:w-[400px]"
                  >
                    <Link to={`/playlists/${playlist.slug}`}>
                      <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3]">
                        {/* Playlist Cover */}
                        <motion.div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${playlist.cover_url.medium})` }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.4 }}
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                        {/* Content */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-between">
                          {/* Top Section */}
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-between items-start"
                          >
                            <Badge 
                              variant="outline" 
                              className="bg-black/50 text-white border-white/20"
                            >
                              {I18n.t('tracks.count', { count: playlist.tracks_count })}
                            </Badge>
                          </motion.div>

                          {/* Bottom Section */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-4">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="bg-white rounded-full p-3 shadow-lg group"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="black"
                                  className="w-5 h-5 group-hover:fill-primary transition-colors"
                                >
                                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                </svg>
                              </motion.button>
                              <div>
                                <h3 className="text-2xl font-black tracking-tight text-white">
                                  {playlist.title}
                                </h3>
                                <p className="text-gray-300 font-medium">
                                  {I18n.t('by', { name: playlist.user.username })}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/80 border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
              onClick={() => {
                const container = document.getElementById('playlists-carousel')
                container.scrollBy({ left: 400, behavior: 'smooth' })
              }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </motion.svg>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-12 md:py-24 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-8">
            {I18n.t('tracks.index.featured_labels')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {labels.map((label) => (
              <Link 
                key={label.id} 
                to={`/${label.username}`}
                className="block transition-transform hover:scale-105"
              >
                <LabelCard label={label} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
