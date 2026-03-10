import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"

function LoadingSkeleton() {
  return (
    <div className="@container/articles-page min-h-screen bg-default px-4 py-12 @sm/articles-page:px-8">
      <div className="mx-auto max-w-7xl @container/articles-shell">
        <div className="flex flex-col gap-8 @4xl/articles-shell:flex-row">
          {/* Sidebar Skeleton */}
          <div className="w-full space-y-8 @4xl/articles-shell:w-56 @6xl/articles-shell:w-64">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="flex flex-wrap gap-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20" />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="@container/articles-content flex-1 space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 gap-6 @3xl/articles-content:grid-cols-2 @6xl/articles-content:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArticleCard({ article, featured = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="@container/article-card group rounded-xl border border-default/10 bg-default overflow-hidden transition-all duration-300 hover:border-default/30"
    >
      {/* Image Container */}
      <Link to={`/articles/${article.slug}`}>
        <div className={`relative ${featured ? 'aspect-[4/3] @3xl/articles-content:aspect-[16/9]' : 'aspect-[4/3]'}`}>
          <img
            src={article.cover_url?.horizontal || article.cover_url}
            alt={article.title}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-300"
          />
          {/* Category Badge - Positioned on image */}
          {article.category && (
            <div className="absolute top-4 left-4">
              <Badge
                variant="outline"
                className="bg-white/90 text-black border-white/20 text-xs font-mono uppercase tracking-wider backdrop-blur-sm"
              >
                {article.category.name}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 space-y-5">
        <Link to={`/articles/${article.slug}`}>
          {/* Title */}
          <h3 className={`line-clamp-2 font-semibold tracking-tight text-default ${featured ? 'text-2xl @lg/article-card:text-3xl @2xl/article-card:text-4xl' : 'text-xl'
            }`}>
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-default/70 line-clamp-2 font-mono mt-2">
            {article.excerpt}
          </p>
        </Link>

        <div className="flex items-center justify-between pt-4 border-t border-default/10">
          {/* Author Info */}
          <Link
            to={`/${article.author?.username}`}
            className="flex items-center gap-3 group/author"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-default/10 group-hover/author:border-default/30 transition-colors">
              <img
                src={article.author?.avatar_url.medium || '/default-avatar.png'}
                alt={article.author?.name || 'Author'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-default group-hover/author:text-primary transition-colors">
                {article.author?.name || 'Anonymous'}
              </p>
              <p className="text-xs text-default/60 font-mono">
                {new Date(article.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </Link>

          {/* Reading Time */}
          {article.reading_time && (
            <div className="text-xs text-default/60 font-mono px-3 py-1 rounded-full border border-default/10">
              {article.reading_time} min read
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function ArticlesIndex() {
  const [searchParams] = useSearchParams()
  const { categorySlug } = useParams()

  // Prefer categorySlug from route param, fallback to query param
  const currentCategory = categorySlug || searchParams.get('category')
  const currentTag = searchParams.get('tag')

  // Build API path for useInfiniteScroll
  let apiPath = '/articles.json'
  const params = new URLSearchParams(window.location.search)
  if (categorySlug) {
    params.set('category', categorySlug)
  }
  if ([...params].length > 0) {
    apiPath += `?${params.toString()}`
  }

  const {
    items: articles,
    loading,
    lastElementRef,
    page
  } = useInfiniteScroll(apiPath)

  if (loading && page == 1) return <LoadingSkeleton />

  return (
    <div className="@container/articles-page min-h-screen bg-default px-4 py-12 text-default @sm/articles-page:px-8">
      <div className="mx-auto max-w-7xl @container/articles-shell">
        <div className="flex flex-col gap-8 @4xl/articles-shell:flex-row">
          {/* Sidebar */}
          <div className="w-full space-y-8 @4xl/articles-shell:w-56 @6xl/articles-shell:w-64">
            <div>
              <h3 className="text-lg font-default tracking-tight mb-4">Categories</h3>
              <div className="space-y-2">
                <Link
                  to="/articles"
                  className={`block px-4 py-3 rounded-lg border transition-colors ${!currentCategory
                      ? 'bg-default text-default border-default'
                      : 'border-default/10 hover:border-default/30'
                    }`}
                >
                  <div className="flex justify-between items-center font-mono">
                    <span>All</span>
                    <span>{articles.total_count}</span>
                  </div>
                </Link>

                {articles.categories?.map(category => (
                  <Link
                    key={category.slug}
                    to={`/articles?category=${category.slug}`}
                    className={`block px-4 py-3 rounded-lg border transition-colors ${currentCategory === category.slug
                        ? 'bg-default text-default border-default'
                        : 'border-default/10 hover:border-default/30'
                      }`}
                  >
                    <div className="flex justify-between items-center font-mono">
                      <span>{category.name}</span>
                      <span>{category.posts_count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-default tracking-tight mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {articles.popular_tags?.map(tag => (
                  <Link
                    key={tag.tag}
                    to={`/articles?tag=${tag.tag}`}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${currentTag === tag.tag
                        ? 'bg-default text-default border-default'
                        : 'border-default/10 hover:border-default/30'
                      }`}
                  >
                    {tag.tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="@container/articles-content flex-1">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-default tracking-tighter @3xl/articles-content:text-5xl @6xl/articles-content:text-6xl">
                {currentCategory
                  ? articles.categories?.find(c => c.slug === currentCategory)?.name
                  : "Magazine"}
              </h1>
            </div>

            <div className="grid auto-rows-max grid-cols-1 gap-6 @3xl/articles-content:grid-cols-2 @6xl/articles-content:grid-cols-3">
              {articles?.map((article, index) => (
                <div
                  ref={index === articles.length - 1 ? lastElementRef : null}
                  key={article.id}
                  className={index === 0 ? "@3xl/articles-content:col-span-2 @3xl/articles-content:row-span-2" : ""}
                >
                  <ArticleCard
                    key={article.id}
                    article={article}
                    featured={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
