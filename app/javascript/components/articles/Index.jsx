import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-default px-4 sm:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-full md:w-64 space-y-8">
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
          <div className="flex-1 space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      className={`group bg-default border border-default/10 rounded-xl overflow-hidden hover:border-default/30 transition-all duration-300 ${
        featured ? 'col-span-2 row-span-2' : ''
      }`}
    >
      {/* Image Container */}
      <Link to={`/articles/${article.slug}`}>
        <div className={`${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'} relative`}>
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
          <h3 className={`tracking-tight text-default font-semibold line-clamp-2 ${
            featured ? 'text-3xl md:text-4xl' : 'text-xl'
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
  
  const currentCategory = searchParams.get('category')
  const currentTag = searchParams.get('tag')

    const {
      items: articles,
      loading,
      lastElementRef,
      page
    } = useInfiniteScroll(`/articles.json${window.location.search}`)

  if (loading && page == 1) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-default text-default px-4 sm:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-8">
            <div>
              <h3 className="text-lg font-default tracking-tight mb-4">Categories</h3>
              <div className="space-y-2">
                <Link 
                  to="/articles"
                  className={`block px-4 py-3 rounded-lg border transition-colors ${
                    !currentCategory 
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
                    className={`block px-4 py-3 rounded-lg border transition-colors ${
                      currentCategory === category.slug
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
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      currentTag === tag.tag
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
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl md:text-6xl font-default tracking-tighter">
                {currentCategory 
                  ? articles.categories?.find(c => c.slug === currentCategory)?.name 
                  : "Magazine"}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max gap-6">
              {articles?.map((article, index) => (
                <div                   
                  ref={index === articles.length - 1 ? lastElementRef : null}
                  key={article.id}
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
