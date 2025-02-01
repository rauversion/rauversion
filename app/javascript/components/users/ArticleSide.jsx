import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function ArticleSide({ articles }) {
  if (!articles || articles.length === 0) return null

  const [first, ...rest] = articles

  return (
    <div className="bg-default py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-12 px-6 sm:gap-y-16 lg:grid-cols-2 lg:px-8">
        <article className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-lg">
          <Link to={`/${first.user.username}`}>
            <time 
              dateTime={format(new Date(first.created_at), 'yyyy-MM-dd')} 
              className="block text-sm leading-6 text-muted"
            >
              {format(new Date(first.created_at), 'MMM dd, yyyy')}
            </time>
            <h2 id="featured-post" className="mt-4 text-3xl font-bold tracking-tight text-default sm:text-4xl">
              {first.title}
            </h2>
            <p className="mt-4 text-lg leading-8 text-emphasis">
              {first.excerpt}
            </p>
            
            <div className="mt-4 flex flex-col justify-between gap-6 sm:mt-8 sm:flex-row-reverse sm:gap-8 lg:mt-4 lg:flex-col">
              <div className="flex">
                <Link 
                  to={`/${first.user.username}/articles`}
                  className="text-sm font-semibold leading-6 text-brand-600"
                  aria-describedby="featured-post"
                >
                  Continue reading <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="flex lg:border-t lg:border-default/10 lg:pt-8">
                <Link 
                  to={`/${first.user.username}`}
                  className="flex gap-x-2.5 text-sm font-semibold leading-6 text-default"
                >
                  <img 
                    src={first.user.avatar_url.small} 
                    className="h-6 w-6 flex-none rounded-full bg-gray-50" 
                    alt={`${first.user.first_name} ${first.user.last_name}`}
                  />
                  {first.user.first_name} {first.user.last_name}
                </Link>
              </div>
            </div>
          </Link>
        </article>

        <div className="mx-auto w-full max-w-2xl border-t border-default/10 pt-12 sm:pt-16 lg:mx-0 lg:max-w-none lg:border-t-0 lg:pt-0">
          <div className="-my-12 divide-y divide-default/10">
            {rest.map((article) => (
              <article key={article.id} className="py-12">
                <div className="group relative max-w-xl">
                  <time 
                    dateTime={format(new Date(article.created_at), 'yyyy-MM-dd')}
                    className="block text-sm leading-6 text-muted"
                  >
                    {format(new Date(article.created_at), 'EEEE, MMMM dd, yyyy')}
                  </time>
                  <h2 className="mt-2 text-lg font-semibold text-default group-hover:text-muted">
                    <Link to={`/articles/${article.slug}`}>
                      <span className="absolute inset-0"></span>
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    {article.excerpt}
                  </p>
                </div>
                <div className="mt-4 flex">
                  <Link 
                    to={`/${article.user.username}`}
                    className="relative z-10 flex items-center gap-x-2.5 text-sm font-semibold text-default"
                  >
                    <img 
                      src={article.user.avatar_url.small} 
                      alt={`${article.user.first_name} ${article.user.last_name}`}
                      className="h-6 w-6 flex-none rounded-full bg-gray-50" 
                    />
                    {article.user.first_name} {article.user.last_name}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
