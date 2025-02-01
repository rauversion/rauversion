import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'

export default function UserArticles() {
  const { username } = useParams()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await get(`/${username}/articles.json`)
        if (response.ok) {
          const data = await response.json
          setArticles(data.articles)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [username])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <Link
          key={article.id}
          to={`/articles/${article.slug}`}
          className="group"
        >
          <div className="aspect-video relative overflow-hidden bg-gray-900 rounded-lg">
            <img
              src={article.cover_url.medium}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200" />
          </div>
          <div className="mt-3">
            <h3 className="font-medium text-lg group-hover:text-primary-500 transition-colors duration-200">
              {article.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {article.description}
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-400">
              <span>{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Link>
      ))}
      
      {articles.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-400">No articles found</p>
        </div>
      )}
    </div>
  )
}
