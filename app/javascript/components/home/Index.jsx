import React, { useEffect, useState } from 'react'
import { get } from '@rails/request.js'
import Header from './Header'
import MainArticles from './MainArticles'
import AlbumReleases from './AlbumReleases'
import FeaturedArtists from './FeaturedArtists'
import CuratedPlaylists from './CuratedPlaylists'
import LatestReleases from './LatestReleases'

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-600"></div>
    </div>
  }

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
    <main className="dark:bg-black">
      {/* Hero Section */}
      {!currentUser && displayHero === "true" && (
        <div className="relative">
          <div aria-hidden="true" className="hidden absolute w-1/2 h-full bg-gray-100 dark:bg-gray-900 lg:block"></div>
          <div className="relative bg-black lg:bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-2">
              <div className="max-w-2xl mx-auto py-6 lg:py-64 lg:max-w-none">
                <div className="lg:pr-16">
                  <a href="/" className="text-white text-sm xl:text-xl font-extrabold">
                    {appName}
                  </a>

                  <h1 className="tracking-tight text-gray-900 dark:text-gray-100 text-3xl xl:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-brand-600">
                    Be your own music industry
                  </h1>
                  <p className="mt-4 text-xl text-gray-100">
                    Empowering independent music communities on the internet
                  </p>
                  <div className="mt-6">
                    <a href="/users/register" className="inline-block bg-brand-600 border border-transparent py-3 px-8 rounded-md font-medium text-white hover:bg-brand-700">
                      Start now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header posts={posts} />
      <MainArticles posts={posts} />
      <AlbumReleases albums={albums} />
      <FeaturedArtists artists={artists} />
      <CuratedPlaylists playlists={playlists} />
      <LatestReleases releases={latestReleases} />
    </main>
  )
}
