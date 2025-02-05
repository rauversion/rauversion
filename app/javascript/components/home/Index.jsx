import React, { useEffect, useState } from 'react'
import { get } from '@rails/request.js'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Skeleton } from '../ui/skeleton'
import Header from './Header'
import MainArticles from './MainArticles'
import AlbumReleases from './AlbumReleases'
import FeaturedArtists from './FeaturedArtists'
import CuratedPlaylists from './CuratedPlaylists'
import LatestReleases from './LatestReleases'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12 px-4 sm:px-8 py-12">
      <Skeleton className="h-[60vh] w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState({
    currentUser: null,
    artists: [],
    posts: [],
    albums: [],
    playlists: [],
    latestReleases: [],
    appName: window.ENV.APP_NAME,
    displayHero: window.ENV.DISPLAY_HERO
  })

  const [loading, setLoading] = useState(true)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0,
    initialInView: true
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get('/home.json')
        const jsonData = await response.json
        setData(jsonData)
      } catch (error) {
        console.error('Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <LoadingSkeleton />

  const { 
    currentUser, 
    artists, 
    posts, 
    albums, 
    playlists, 
    latestReleases, 
    appName, 
    displayHero 
  } = data

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="dark:bg-black min-h-screen"
    >
      {/* Hero Section */}
      {!currentUser && displayHero === "true" && (
        <motion.div 
          variants={fadeInUp}
          className="relative"
        >
          <div aria-hidden="true" className="hidden absolute w-1/2 h-full bg-gradient-to-r from-gray-100 to-transparent dark:from-gray-900 lg:block"></div>
          <div className="relative bg-black lg:bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-2">
              <div className="max-w-2xl mx-auto py-24 lg:py-64 lg:max-w-none">
                <div className="lg:pr-16">
                  <motion.a 
                    href="/"
                    whileHover={{ scale: 1.05 }}
                    className="text-white text-sm xl:text-xl font-extrabold"
                  >
                    {appName}
                  </motion.a>

                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="tracking-tight text-gray-900 dark:text-gray-100 text-4xl xl:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-brand-600 mt-4"
                  >
                    Be your own music industry
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-xl text-gray-100"
                  >
                    Empowering independent music communities on the internet
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                  >
                    <motion.a 
                      href="/users/register"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block bg-brand-600 border border-transparent py-4 px-8 rounded-md text-lg font-medium text-white hover:bg-brand-700 transition-colors"
                    >
                      Start now
                    </motion.a>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <>
        <motion.div variants={fadeInUp}>
          <Header posts={posts} />
        </motion.div>

        <div ref={ref}>
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            <motion.div variants={fadeInUp}>
              <MainArticles posts={posts} />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <AlbumReleases albums={albums} />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <FeaturedArtists artists={artists} />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <CuratedPlaylists playlists={playlists} />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <LatestReleases />
            </motion.div>
          </motion.div>
        </div>
      </>
    </motion.main>
  )
}
