import React, { useEffect, useState } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import { get } from '@rails/request.js'
import Header from './Header'

export default function PodcastLayout() {
  const { username } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get(`/${username}/podcasts/podcaster_info.json`)
        if (response.ok) {
          const jsonData = await response.json
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching podcaster info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  if (loading && !data) {
    return (
      <div className="flex-grow bg-default text-default">
        <div className="mx-auto w-3/4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Header data={data} currentUser={data?.current_user} />
      
      <main className="border-t border-subtle lg:relative lg:mb-28 lg:ml-112 lg:border-t-0 xl:ml-120">
                <svg aria-hidden="true" className="absolute left-0 top-0 h-20 w-full">
          <defs>
            <linearGradient id="podcast-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="40%" stopColor="white"></stop>
              <stop offset="100%" stopColor="black"></stop>
            </linearGradient>
            <linearGradient id="podcast-gradient-color">
              <stop offset="0%" stopColor="#4989E8"></stop>
              <stop offset="50%" stopColor="#6159DA"></stop>
              <stop offset="100%" stopColor="#FF54AD"></stop>
            </linearGradient>
            <mask id="podcast-mask">
              <rect width="100%" height="100%" fill="url(#podcast-pattern)"></rect>
            </mask>
            <pattern id="podcast-pattern" width="400" height="100%" patternUnits="userSpaceOnUse">
              {Array.from({ length: 50 }).map((_, i) => (
                <rect
                  key={i}
                  width="2"
                  height={`${40 + Math.random() * 60}%`}
                  x={i * 4}
                  fill="url(#podcast-gradient)"
                />
              ))}
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#podcast-gradient-color)"
            mask="url(#podcast-mask)"
            opacity="0.25"
          ></rect>
        </svg>
        <Outlet context={{ user: data?.user, podcasterInfo: data?.podcaster_info }} />
      </main>
    </div>
  )
}
