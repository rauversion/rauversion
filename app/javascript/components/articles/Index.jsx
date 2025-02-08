import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'

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
    <Link to={`/articles/${article.slug}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={`group relative bg-default border border-default/10 rounded-xl overflow-hidden hover:border-default/30 transition-all duration-300 ${
          featured ? 'col-span-2 row-span-2' : ''
        }`}
      >
        <div className={`relative ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
          {/* Background Image with Gradient */}
          <img 
            src={article.cover_url?.horizontal || article.cover_url} 
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-300" />
          
          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="space-y-4">
              {/* Category Badge */}
              {article.category && (
                <Badge 
                  variant="outline" 
                  className="bg-default text-default border-default text-xs font-mono uppercase tracking-wider"
                >
                  {article.category.name}
                </Badge>
              )}

              {/* Title */}
              <h3 className={`font-white tracking-tight text-white line-clamp-2 mix-blend-difference ${
                featured ? 'text-4xl md:text-5xl' : 'text-xl'
              }`}>
                {article.title}
              </h3>

              {/* Excerpt */}
              <p className="text-gray-300 line-clamp-2 font-mono">
                {article.excerpt}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                {article.reading_time && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                    <span>{article.reading_time} min read</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function ArticlesIndex() {
  const [searchParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  
  const currentCategory = searchParams.get('category')
  const currentTag = searchParams.get('tag')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const articlesResponse = await fetch(`/articles.json${window.location.search}`)
        const articlesData = await articlesResponse.json()
        setArticles(articlesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  if (loading) return <LoadingSkeleton />

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
              {articles.items?.map((article, index) => (
                <ArticleCard 
                  key={article.id} 
                  article={article}
                  featured={index === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
