import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import I18n from 'stores/locales'

const PlayButton = () => (
  <motion.button 
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="bg-white rounded-full p-4 shadow-lg group"
  >
    <motion.svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="black"
      className="w-6 h-6 group-hover:fill-primary transition-colors"
    >
      <polygon points="6 3 20 12 6 21 6 3"></polygon>
    </motion.svg>
  </motion.button>
)

const AlbumCard = ({ album, isLarge = false }) => {
  const [isHovered, setIsHovered] = useState(false)
  const albumPath = album.releases?.length > 0 ? `/albums/${album.releases[0].slug}` : `/playlists/${album.slug}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${isLarge ? 'col-span-2 row-span-2' : 'col-span-1'}`}
    >
      <Link to={albumPath}>
        <div className={`relative overflow-hidden rounded-2xl bg-black aspect-square ${isLarge ? 'md:aspect-[4/3]' : ''}`}>
          {/* Album Cover with Glitch Effect */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${album.cover_image})` }}
            animate={isHovered ? {
              scale: [1.1, 1.12, 1.1],
              filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"]
            } : {
              scale: 1.1,
              filter: "brightness(1)"
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Glitch Overlay */}
          <AnimatePresence>
            {isHovered || true && (
              <motion.div
                initial={{ opacity: 0.6 }}
                //animate={{ opacity: [0.1, 0.2, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 mix-blend-difference"
                style={{
                  backgroundImage: `url(${album.cover_url.medium})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  transform: 'translate(5px, 5px)'
                }}
              />
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            {/* Top Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={isHovered ? { opacity: 1, y: 0 } : {}}
              className="flex justify-between items-start"
            >
              <Badge 
                variant="outline" 
                className="bg-black/50 text-white border-white/20"
              >
                {I18n.t('home.album_releases.new_release')}
              </Badge>

              {album.price && (
                <Badge 
                  variant="outline" 
                  className="bg-white text-black border-white"
                >
                  ${album.price}
                </Badge>
              )}
            </motion.div>

            {/* Bottom Section */}
            <motion.div
              initial={false}
              animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <PlayButton />
                <div className="space-y-1">
                  <motion.h3 
                    className={`font-black tracking-tight text-white ${isLarge ? 'text-4xl' : 'text-2xl'}`}
                    animate={isHovered ? {
                      textShadow: [
                        "3px 3px 0px rgba(255,0,0,0.5), -3px -3px 0px rgba(0,255,255,0.5)",
                        "-3px 3px 0px rgba(255,0,0,0.5), 3px -3px 0px rgba(0,255,255,0.5)",
                        "3px 3px 0px rgba(255,0,0,0.5), -3px -3px 0px rgba(0,255,255,0.5)"
                      ]
                    } : {}}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    {album.title}
                  </motion.h3>
                  <p className="text-gray-300 font-medium">
                    {album.user.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{album.tracks_count || 0} {I18n.t('home.album_releases.tracks_count')}</span>
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <span>{album.genre || I18n.t('home.album_releases.default_genre')}</span>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 opacity-50 pointer-events-none"
            initial={false}
            animate={isHovered ? {
              background: [
                "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
                "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
                "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

export default function AlbumReleases({ albums }) {
  if (!albums || albums.length === 0) return null

  return (
    <section className="px-4 sm:px-8 py-16 md:py-24 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
              {I18n.t('home.album_releases.title')}
            </h2>
            <p className="text-lg text-gray-400">
              {I18n.t('home.album_releases.subtitle')}
            </p>
          </motion.div>
          
          <Link to="/albums">
            <Button 
              variant="outline" 
              size="lg"
              className="group border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
            >
              {I18n.t('home.album_releases.browse_all')}
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

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {albums.map((album, index) => (
            <AlbumCard 
              key={album.id} 
              album={album} 
              isLarge={index === 0}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
