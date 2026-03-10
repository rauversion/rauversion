import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Newspaper } from 'lucide-react'
import I18n from "@/stores/locales"

export default function Sidebar({ user }) {
  return (
    <div className="hidden min-w-0 rounded-md bg-default @5xl/profile:block @5xl/profile:w-1/3 @5xl/profile:pl-8 @container/sidebar">
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

        <p className="mb-2 h-40 overflow-hidden text-ellipsis text-base font-normal text-subtle @lg/sidebar:h-56 @lg/sidebar:text-xl">
          {user?.bio}
        </p>

        <div className="flex flex-col gap-2 @md/sidebar:flex-row @md/sidebar:justify-end">
          <Link
            to={`/${user?.username}/about`}
          >
            <Button variant="outline" size="sm" className="w-full @md/sidebar:w-auto">
              {I18n.t("tracks.show.about")}
            </Button>
          </Link>

          <Link
            to={`/${user?.username}/press-kit`}
          >
            <Button variant="outline" size="sm" className="w-full @md/sidebar:w-auto">
              <Newspaper className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{I18n.t("press_kit.title")}</span>
            </Button>
          </Link>
        </div>



        <div className="overflow-auto no-scrollbar relative" data-scroll-target="scrollContainer">
          <div className="grid grid-cols-1 gap-4 @2xl/sidebar:grid-cols-2">
            {user?.photos?.slice(0, 2).map((photo) => (
              <div key={photo.id} className="min-w-0">
                <Link
                  data-turbo-frame="modal"
                  className="h-auto max-w-full rounded-lg"
                  to={`/photos/${photo.id}?user_id=${user.id}`}
                >
                  <div
                    className="card mt-5 h-32 w-full rounded-md bg-muted"
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
    </div >
  )
}
