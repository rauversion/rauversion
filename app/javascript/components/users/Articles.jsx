import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { ChevronLeft } from 'lucide-react'
import I18n from '@/stores/locales'

export default function UserArticles() {
  const { username } = useParams()
  const {
    items: articles,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/articles.json`)

  return (
    <div className="bg-default py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-default sm:text-4xl">
            {I18n.t('articles.blog_title', { name: `${articles[0]?.user?.first_name} ${articles[0]?.user?.last_name}` })}
          </h2>
          
          <p className="mt-2 text-lg leading-8 text-muted">
            <Link 
              to={`/${username}`} 
              className="flex items-center text-sm font-semibold leading-6 text-brand-600"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {I18n.t('articles.back_to_music', { username })}
            </Link>
          </p>

          <div className="mt-10 space-y-16 border-t border-subtle pt-10 sm:mt-16 sm:pt-16">
            {articles.map((article, index) => (
              <div 
                key={article.id}
                ref={articles.length === index + 1 ? lastElementRef : null}
                className="flex max-w-xl flex-col items-start justify-between"
              >
                <div className="flex items-center gap-x-4 text-xs">
                  <time dateTime={article.created_at} className="text-subtle">
                    {new Date(article.created_at).toLocaleDateString(undefined, { 
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </time>
                </div>

                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-default group-hover:text-muted">
                    <Link to={`/articles/${article.slug}`}>
                      <span className="absolute inset-0"></span>
                      {article.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted">
                    {article.excerpt}
                  </p>
                </div>

                <div className="relative mt-8 flex items-center gap-x-4">
                  <img 
                    src={article.user.avatar_url.small} 
                    alt={article.user.username}
                    className="h-10 w-10 rounded-full bg-gray-50" 
                  />
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-default">
                      <Link to={`/${article.user.username}`}>
                        <span className="absolute inset-0"></span>
                        {article.user.username}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('articles.loading')}></div>
              </div>
            )}

            {articles.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-400">{I18n.t('articles.no_articles')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
