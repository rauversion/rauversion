import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactDOM from "react-dom/client";
import PlaylistComponent from "../puck/Playlist";


import { EditorComponent } from './EditArticle'

export default function ArticleShow({ preview }) {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  const url = preview ? `/articles/${slug}/preview.json` : `/articles/${slug}.json`

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(url)
        const data = await response.json()
        setArticle(data)
      } catch (error) {
        console.error('Error fetching article:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [slug])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link to="/articles" className="text-primary hover:underline">
          Back to articles
        </Link>
      </div>
    )
  }

  return (
    <div className="relative py-16 bg-default overflow-hidden">
      <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full">
        <div className="relative h-full text-lg max-w-prose mx-auto" aria-hidden="true">
          <svg
            className="absolute top-12 left-full transform translate-x-32"
            width="404"
            height="384"
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-gray-200 dark:text-gray-800"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
          </svg>
          <svg
            className="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-32"
            width="404"
            height="384"
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-gray-200 dark:text-gray-800"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
          </svg>
          <svg
            className="absolute bottom-12 left-full transform translate-x-32"
            width="404"
            height="384"
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="d3eb07ae-5182-43e6-857d-35c643af9034"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-gray-200 dark:text-gray-800"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
          </svg>
        </div>
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="text-lg max-w-prose mx-auto">
          <h1>
            <Link to={`/${article.author.username}`} className="flex items-center justify-center gap-2">
              <img
                src={article.author.avatar_url.small}
                alt={article.author.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="block text-base text-center text-brand-600 font-semibold tracking-wide uppercase">
                By {article.author.name}
              </span>
            </Link>
            <span className="mt-2 block text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              {article.title}
            </span>
          </h1>

          {article.cover_url && (
            <div className="mt-8 aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              <img
                src={article.cover_url.large}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <p className="mt-8 text-xl text-gray-500 dark:text-gray-300 leading-8">
            {article.excerpt}
          </p>
        </div>

        <div
          id={`article-${article.id}`}
          className="post-wrapper mt-6 prose lg:prose-2xl dark:prose-invert prose-indigo- prose-lg- text-gray-500 dark:text-gray-300 mx-auto"
          data-controller="medium-zoom"
        // dangerouslySetInnerHTML={{ __html: article.body }}
        >
          <EditorComponent value={article.body} readOnly={true} />
        </div>

      </div>
    </div>
  )
}
