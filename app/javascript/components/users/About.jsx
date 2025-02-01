import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import { Plus } from 'lucide-react'
import useAuthStore from '../../stores/authStore'

export default function UserAbout() {
  const { username } = useParams()
  const [data, setData] = useState(null)
  const currentUser = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get(`/${username}/about.json`)
        if (response.ok) {
          const jsonData = await response.json
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  if (loading || !data?.user) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  const { user, stats } = data

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
      <div className="flex space-x-5">
        <div>
          <div className="space-y-2 my-6">
            <div className="p-2">
              <div className="text-4xl font-extrabold">{user.followers_count}</div>
              <div className="text-muted">Followers</div>
            </div>

            <div className="p-2">
              <div className="text-4xl font-extrabold">{stats.monthly_listeners}</div>
              <div className="text-sm text-muted">Monthly Listeners</div>
            </div>

            {stats.top_countries?.map((location, index) => (
              <div key={index} className="p-2">
                <div className="text-xl font-bold">{location.country}</div>
                <div className="text-sm text-muted">{location.count} listeners</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sm:max-w-lg py-5">
          <h1 className="text-4xl font-bold tracking-tight text-default sm:text-6xl">
            <Link to={`/${user.username}`} className="text-brand-500 hover:underline">
              {user.username}
            </Link>
          </h1>
          <p className="text-muted py-4">
            {user.country && user.city ? `${user.country}, ${user.city}` : null}
          </p>
          <p className="mt-4 text-xl text-subtle">
            {user.bio}
          </p>
        </div>
      </div>

      {currentUser?.id === user.id && (
        <div className="flex justify-start">
          <Link
            to="/photos/new"
            className="button-sm-outline inline-flex items-center gap-2"
            data-turbo-frame="modal"
          >
            <Plus className="h-4 w-4" />
            New Image
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
        {user.photos?.map((photo) => (
          <div key={photo.id}>
            <Link
              to={`/photos/${photo.id}?user_id=${user.id}`}
              data-turbo-frame="modal"
              className="h-auto max-w-full rounded-lg"
            >
              <img
                src={photo.variants.medium}
                alt=""
                className="rounded-lg"
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
