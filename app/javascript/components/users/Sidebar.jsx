import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar({ user }) {
  return (
    <div className="hidden w-1/3 xl:block xl:col-span-4 bg-default rounded-md">
      <div className="sticky top-4 space-y-4 p-4">
        {/*<div className="p-4 border-l-1 border-l-gray-50 dark:border-l-gray-800">
          <div className="grid grid-cols-3 divide-x dark:divide-gray-700">
            <div className="p-4">
              <p className="text-base font-medium text-foreground dark:text-muted">
                Siguiendo
              </p>
              <span className="text-base font-normal text-muted-foreground dark:text-muted text-xl">
                <Link to={`/${user?.username}/followees`}>
                  {user?.followees_count || 0}
                </Link>
              </span>
            </div>
            <div className="p-4">
              <p className="text-base font-medium text-foreground dark:text-muted">
                Seguidores
              </p>
              <span className="text-base font-normal text-muted-foreground dark:text-muted text-xl">
                <Link to={`/${user?.username}/followers`}>
                  {user?.followers_count || 0}
                </Link>
              </span>
            </div>
            <div className="p-4">
              <p className="text-base font-medium text-foreground dark:text-muted">
                Pistas
              </p>
              <span className="text-base font-normal text-muted-foreground dark:text-muted text-xl">
                {user?.tracks_count || 0}
              </span>
            </div>
          </div>
        </div>*/}

        <p className="font-normal text-xl text-subtle mb-2 text-ellipsis overflow-hidden h-56">
          {user?.bio}
        </p>

        <div className="flex justify-end">
          <Link
            className="mr-2 btn-xs outline rounded-sm p-1"
            to={`/${user?.username}/about`}
          >
            more
          </Link>
        </div>

        <div className="overflow-auto no-scrollbar relative" data-scroll-target="scrollContainer">
          <div className="grid grid-cols-1- grid-flow-col grid-rows-1- sm:gap-x-1 md:grid-cols-4- md:gap-y-0- lg:gap-x-2">
            {user?.photos?.slice(0, 2).map((photo) => (
              <div key={photo.id} className="w-64 m-4">
                <Link
                  data-turbo-frame="modal"
                  className="h-auto max-w-full rounded-lg"
                  to={`/photos/${photo.id}?user_id=${user.id}`}
                >
                  <div
                    className="card bg-muted m-auto w-full h-32 mt-5 rounded-md"
                    style={{
                      backgroundImage: `url(${photo.url})`,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover'
                    }}
                  >
                    <div className="flex flex-row items-end h-full w-full" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
