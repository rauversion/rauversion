import React, { useEffect, useState } from 'react'
import { useParams, Link, Outlet, useLocation } from 'react-router-dom'
import { get } from '@rails/request.js'
import { format } from 'date-fns'
import { Play, Pause, Share2, ThumbsUp } from 'lucide-react'
import useAudioStore from '../../stores/audioStore'
import useAuthStore from '../../stores/authStore'
import { ModernTrackCell } from '../tracks/TrackCell'
import clsx from 'clsx'
import Sidebar from './Sidebar'

export default function UserShow() {
  const { username } = useParams()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuItems, setMenuItems] = useState([])
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()
  const { currentUser } = useAuthStore()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}.json`)
        if (response.ok) {
          const data = await response.json
          setUser(data.user)
          setMenuItems(data.user.menu_items)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [username])

  const handlePlay = (trackId) => {
    if (currentTrackId === trackId && isPlaying) {
      pause()
    } else {
      play(trackId)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Profile Header */}
      <div className="relative h-56">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${user.profile_header_url.large}')` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end space-x-6">
            <img
              src={user.avatar_url.medium}
              alt={user.username}
              className="w-32 h-32 rounded-full border-4 border-black"
            />
            
            <div>
              <h1 className="text-4xl font-bold">
                {user.hide_username_from_profile 
                  ? `${user.first_name} ${user.last_name}`
                  : user.username
                }
              </h1>
              
              {!user.hide_username_from_profile && (
                <p className="text-lg text-gray-300">
                  {user.first_name} {user.last_name}
                </p>
              )}
              
              {(user.city || user.country) && (
                <p className="text-gray-400">
                  {user.city} {user.country}
                </p>
              )}

              <div className="mt-4 flex space-x-4 text-sm">
                <div>
                  <span className="font-medium">{user.stats.tracks_count}</span>
                  <span className="text-gray-400 ml-1">tracks</span>
                </div>
                <div>
                  <span className="font-medium">{user.stats.followers_count}</span>
                  <span className="text-gray-400 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-medium">{user.stats.following_count}</span>
                  <span className="text-gray-400 ml-1">following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mb-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex space-x-8">
            {menuItems.map((item) => (
              !item.hidden && (
                <li key={item.name}>
                  <Link
                    to={item.to}
                    className={clsx(
                      'inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium',
                      location.pathname === item.to
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              )
            ))}
          </ul>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[400px]">
        <div className="flex">
          <div className="flex-grow bg-default text-default">
            <Outlet context={{ user, handlePlay, currentTrackId, isPlaying }} />
          </div>
          <Sidebar user={user} />
        </div>
      </div>
    </div>
  )
}
