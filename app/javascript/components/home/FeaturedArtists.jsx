import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'

const ArtistCard = ({ artist }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative aspect-[4/5] group"
    >
      <Link to={`/${artist.username}`}>
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {/* Background Image with Glitch Effect */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${artist.avatar_url.medium})` }}
            animate={isHovered ? {
              scale: [1.1, 1.12, 1.1],
              filter: ["brightness(0.8)", "brightness(0.85)", "brightness(0.8)"]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            animate={isHovered ? {
              opacity: [0.3, 0.4, 0.3]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <motion.div
              initial={false}
              animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0.8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Artist Name with Glitch Effect */}
              <motion.h3 
                className="text-3xl md:text-4xl font-black tracking-tight text-white mix-blend-difference"
                animate={isHovered ? {
                  textShadow: [
                    "2px 2px 0px rgba(255,0,0,0.5), -2px -2px 0px rgba(0,255,255,0.5)",
                    "2px -2px 0px rgba(255,0,0,0.5), -2px 2px 0px rgba(0,255,255,0.5)",
                    "2px 2px 0px rgba(255,0,0,0.5), -2px -2px 0px rgba(0,255,255,0.5)"
                  ]
                } : {}}
                transition={{ duration: 0.2, repeat: isHovered ? Infinity : 0 }}
              >
                {artist.username}
              </motion.h3>

              {/* Artist Full Name */}
              {artist.full_name && (
                <motion.p 
                  className="text-lg text-gray-300 font-medium"
                  animate={isHovered ? { x: [-1, 1, -1] } : {}}
                  transition={{ duration: 0.1, repeat: isHovered ? Infinity : 0 }}
                >
                  {artist.full_name}
                </motion.p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{artist.tracks_count || 0} Tracks</span>
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <span>{artist.followers_count || 0} Followers</span>
              </div>

              {/* View Profile Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full bg-black/50 border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  View Profile
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            initial={false}
            animate={isHovered ? {
              background: [
                "radial-gradient(circle at center, rgba(var(--primary-rgb), 0.3) 0%, transparent 70%)",
                "radial-gradient(circle at center, rgba(var(--primary-rgb), 0.4) 0%, transparent 70%)",
                "radial-gradient(circle at center, rgba(var(--primary-rgb), 0.3) 0%, transparent 70%)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

export default function FeaturedArtists({ artists }) {
  if (!artists || artists.length === 0) return null

  return (
    <section className="px-4 sm:px-8 py-16 md:py-24 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Featured Artists
            </h2>
            <p className="text-lg text-gray-400">
              Discover emerging talent and established creators
            </p>
          </motion.div>
          
          <Link to="/artists">
            <Button 
              variant="outline" 
              size="lg"
              className="group border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300"
            >
              View All
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
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
