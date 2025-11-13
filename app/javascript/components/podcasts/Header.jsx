import React from 'react'
import { Link } from 'react-router-dom'
import { Rss } from 'lucide-react'

export default function PodcastHeader({ data, currentUser }) {
  const platforms = [
    { key: 'spotify', url: data?.podcaster_info?.spotify_url },
    { key: 'apple_podcasts', url: data?.podcaster_info?.apple_podcasts_url },
    { key: 'overcast', url: data?.podcaster_info?.overcast_url },
    { key: 'google_podcasts', url: data?.podcaster_info?.google_podcasts_url },
    { key: 'stitcher', url: data?.podcaster_info?.stitcher_url },
    { key: 'pocket_casts', url: data?.podcaster_info?.pocket_casts_url }
  ].filter(p => p.url)

  return (
    <header className="bg-default lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-112 lg:items-start lg:overflow-y-auto xl:w-120">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:w-16 lg:flex-none lg:items-center lg:whitespace-nowrap lg:py-12 lg:text-sm lg:leading-7 lg:[writing-mode:vertical-rl]">
        <span className="font-mono text-muted">Hosted by</span>
        <span className="mt-6 flex gap-6 font-bold text-default">
          <Link to={`/${data?.user?.username}`}>{data?.user?.username}</Link>
          <span aria-hidden="true" className="text-muted-foreground">/</span>
        </span>
        {data?.podcaster_info?.hosts?.map((host) => (
          <span key={host.id} className="mt-6 flex gap-6 font-bold text-default">
            <Link to={`/${host.username}`}>{host.username}</Link>
            <span aria-hidden="true" className="text-muted-foreground">/</span>
          </span>
        ))}
      </div>

      <div className="relative z-10 mx-auto px-4 pb-12 pt-10 sm:px-6 md:max-w-2xl md:px-4 lg:min-h-full lg:flex-auto lg:border-x lg:border-subtle lg:px-8 lg:py-20 lg:pb-28 xl:px-20">

        <a className="relative mx-auto block w-48 overflow-hidden rounded-lg bg-muted shadow-xl shadow-muted sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl" aria-label="Homepage">
          {data?.podcaster_info?.avatar_url ? (
            <img src={data.podcaster_info.avatar_url} alt="" className="w-full" style={{ color: 'transparent' }} />
          ) : data?.user?.avatar_url ? (
            <img src={data.user.avatar_url} alt="" className="w-full" style={{ color: 'transparent' }} />
          ) : null}
          <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl"></div>
        </a>

        <div className="mt-10 text-center lg:mt-12 lg:text-left">
          <p className="text-xl font-bold text-default">
            <Link to={`/${data?.user?.username}/podcasts`}>
              {data?.podcaster_info?.title}
            </Link>
          </p>
          <p className="mt-3 text-lg font-medium leading-8 text-subtle">
            {data?.podcaster_info?.description}
          </p>

          {currentUser?.id === data?.user?.id && (
            <Link to={`/${data?.user?.username}/settings/podcast`} className="link text-xs">
              Edit podcast info
            </Link>
          )}
        </div>

        <section className="mt-12 hidden lg:block">
          <h2 className="flex items-center font-mono text-sm font-medium leading-7 text-default">
            <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2.5 w-2.5">
              <path d="M0 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5Z" className="fill-violet-300"></path>
              <path d="M6 1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V1Z" className="fill-pink-300"></path>
            </svg>
            <span className="ml-2.5">About</span>
          </h2>
          <p className="mt-2 text-base leading-7 text-subtle lg:line-clamp-4">
            {data?.podcaster_info?.about}
          </p>
          <Link
            to={`/${data?.user?.username}/podcasts/about`}
            className="mt-2 hidden text-sm font-bold leading-6 text-pink-500 hover:text-pink-700 active:text-pink-900 lg:inline-block"
          >
            Show more
          </Link>
        </section>

        <section className="mt-10 lg:mt-12">
          <h2 className="sr-only flex items-center font-mono text-sm font-medium leading-7 text-default lg:not-sr-only">
            <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2.5 w-2.5">
              <path d="M0 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5Z" className="fill-indigo-300"></path>
              <path d="M6 1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V1Z" className="fill-blue-300"></path>
            </svg>
            <span className="ml-2.5">Listen</span>
          </h2>
          <div className="h-px bg-gradient-to-r from-subtle/0 via-subtle to-subtle/0 lg:hidden"></div>
          <ul role="list" className="mt-4 flex justify-center gap-10 text-base font-medium leading-7 text-subtle sm:gap-8 lg:flex-col lg:gap-4">
            {platforms.map(({ key, url }) => (
              <li key={key} className="flex">
                <a
                  className="group flex items-center"
                  aria-label={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* We'll need to add the platform icons */}
                  <span className="hidden sm:ml-3 sm:block">
                    {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </a>
              </li>
            ))}

            <li className="flex">
              <a
                href={`/${data?.user?.username}/podcasts.rss`}
                className="group flex items-center"
                aria-label="RSS Feed"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 32 32" className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.5 4h15A4.5 4.5 0 0 1 28 8.5v15a4.5 4.5 0 0 1-4.5 4.5h-15A4.5 4.5 0 0 1 4 23.5v-15A4.5 4.5 0 0 1 8.5 4ZM13 22a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-6-6a9 9 0 0 1 9 9h3A12 12 0 0 0 7 13v3Zm5.74-4.858A15 15 0 0 0 7 10V7a18 18 0 0 1 18 18h-3a15 15 0 0 0-9.26-13.858Z"></path>
                </svg>
                <span className="hidden sm:ml-3 sm:block">RSS Feed</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </header>
  )
}
