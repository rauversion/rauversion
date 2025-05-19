import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import I18n from 'stores/locales'
import { cn } from '../../lib/utils'

const ContentCard = ({ content, variant = 'default', className }) => {
  const [isHovered, setIsHovered] = useState(false)


  const variants = {
    default: 'mb-4 w-full aspect-square',
    wide: 'mb-4 w-full aspect-[2/1]',
    tall: 'mb-4 w-full aspect-[3/4]',
    large: 'mb-4 w-full aspect-square',
    featured: 'mb-4 w-full aspect-[4/3]',
    cool: 'w-full aspect-[4/5] h-full'
  }


  if (content.type === 'cta') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(variants[variant], className)}
      >
        <div className="h-full rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex flex-col items-start justify-between">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold">{content.title}</h3>
            <p className="text-muted-foreground">{content.description}</p>
          </div>
          <Button size="lg" className="mt-4">
            {content.buttonText}
          </Button>
        </div>
      </motion.div>
    )
  }

  if (content.type === 'album') {
    const albumPath = `/albums/${content.slug}`
    // "Cool" variant: glassmorphism, border glow, 3D tilt, standardized aspect
    if (variant === "cool") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{
            scale: 1.04,
            rotateX: 4,
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25), 0 0 0 4px #a5b4fc55"
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={cn(
            variants[variant],
            "group relative rounded-3xl overflow-hidden shadow-xl transition-all duration-300"
          )}
        >
          <Link to={albumPath} className="block h-full w-full">
            {/* Cover Image */}
            <motion.div
              className="absolute inset-0 bg-cover bg-center transition-all duration-300 rounded-3xl"
              style={{ backgroundImage: `url(${content.cover_url?.medium})` }}
              animate={isHovered ? {
                scale: 1.08,
                filter: "brightness(0.7) blur(1.5px)"
              } : {
                scale: 1,
                filter: "brightness(1) blur(0px)"
              }}
              transition={{ duration: 0.4 }}
            />

            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 rounded-3xl" />
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
              <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 shadow-lg border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="secondary" className="bg-background/30 backdrop-blur-sm">
                    {content.badge || I18n.t('home.album_releases.new_release')}
                  </Badge>
                  {content.price && (
                    <Badge variant="secondary" className="bg-background/30 backdrop-blur-sm">
                      ${content.price}
                    </Badge>
                  )}
                </div>
                <motion.h3
                  className="font-bold tracking-tight text-2xl text-foreground mb-2"
                  whileHover={{ scale: 1.04 }}
                >
                  {content.title}
                </motion.h3>
                <div className="flex items-center gap-3">
                  {content?.user?.avatar_url ? (
                    <img
                      src={content.user.avatar_url.small}
                      alt={content.user.username}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-background/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {content?.user?.username?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {content?.user?.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Animated border glow */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-indigo-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
              animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            />
          </Link>
        </motion.div>
      )
    }
    // fallback to original for other variants
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(variants[variant], className)}
      >
        <Link to={albumPath}>
          <div className="relative h-full overflow-hidden rounded-3xl bg-muted">
            {/* Cover Image */}
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${content.cover_url?.medium})` }}
              animate={isHovered ? {
                scale: 1.05,
                filter: "brightness(0.8)"
              } : {
                scale: 1,
                filter: "brightness(1)"
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-background/30 backdrop-blur-sm">
                  {content.badge || I18n.t('home.album_releases.new_release')}
                </Badge>
                {content.price && (
                  <Badge variant="secondary" className="bg-background/30 backdrop-blur-sm">
                    ${content.price}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <motion.h3
                  className={cn(
                    variants[variant],
                    "group relative rounded-3xl overflow-hidden shadow-xl transition-all duration-300"
                  )}
                >
                  {content.title}
                </motion.h3>

                <div className="flex items-center gap-3">
                  {content?.user?.avatar_url ? (
                    <img
                      src={content.user.avatar_url.small}
                      alt={content.user.username}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-background/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {content?.user?.username?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {content?.user?.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // Default image card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(variants[variant], className)}
    >
      <div className="relative h-full overflow-hidden rounded-3xl bg-muted">
        <motion.img
          src={content.image}
          alt={content.title}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}

export default function AlbumReleases({ albums }) {
  if (!albums || albums.length === 0) return null

  // Transform albums into content items
  const contentItems = [
    /*{
      type: 'cta',
      title: I18n.t('home.album_releases.join_title'),
      description: I18n.t('home.album_releases.join_description'),
      buttonText: I18n.t('home.album_releases.join_button'),
    },*/
    ...albums.map(album => ({
      type: 'album',
      ...album
    }))
  ]

  return (
    <section className="px-4 sm:px-8 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {contentItems.map((content, index) => (
            <ContentCard
              key={content.id || index}
              content={content}
              variant="cool"
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
