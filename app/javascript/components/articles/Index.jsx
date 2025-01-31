import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function ArticlesIndex() {
  const [searchParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [popularTags, setPopularTags] = useState([])
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-default text-default px-4 sm:px-8 py-12">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar with categories and tags */}
          <div className="w-full md:w-64 space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                <Link 
                  to="/articles"
                  className={`block px-3 py-2 rounded-lg ${
                    !currentCategory 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>All</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {articles.total_count}
                    </span>
                  </div>
                </Link>

                {articles.categories?.map(category => (
                  <Link
                    key={category.slug}
                    to={`/articles?category=${category.slug}`}
                    className={`block px-3 py-2 rounded-lg ${
                      currentCategory === category.slug
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {category.posts_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {articles.popular_tags?.map(tag => (
                  <Link
                    key={tag.tag}
                    to={`/articles?tag=${tag.tag}`}
                    className={`px-3 py-1 text-sm rounded-full ${
                      currentTag === tag.tag
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tag.tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight mb-8">
              {currentCategory 
                ? articles.categories?.find(c => c.slug === currentCategory)?.name 
                : "All Articles"}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.items?.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination component will go here */}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArticleCard({ article }) {
  return (
    <Link to={`/articles/${article.slug}`} className="block group">
      <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {article.cover_image && (
          <div className="aspect-w-16 aspect-h-9">
            <img 
              src={article.cover_image} 
              alt={article.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div className="p-4">
          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-sm text-muted mt-2">
            {article.excerpt}
          </p>
          <div className="mt-4 flex items-center text-sm text-muted">
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
            {article.reading_time && (
              <>
                <span className="mx-2">•</span>
                <span>{article.reading_time} min read</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
