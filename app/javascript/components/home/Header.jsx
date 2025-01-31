import React from 'react'
import { Link } from 'react-router-dom'

function truncate(str, length = 220) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export default function Header({ posts }) {
  if (!posts || posts.length === 0) return null

  const post = posts[0]

  return (
    <header className="relative h-[80vh] md:h-screen">
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${post.cover_url.large})`,
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 px-4 sm:px-8 pt-16 md:pt-32">
        <Link to={`/articles/${post.slug}`}>
          <div className="max-w-6xl mx-auto">
            <h1 className="text-[10vw] md:text-[6vw] font-bold leading-none tracking-tighter mb-6 text-default">
              {post.title}
            </h1>
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-0">
              <p className="max-w-md text-base md:text-lg text-gray-300">
                {truncate(post.excerpt, 220)}
              </p>
              <button className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                EXPLORE
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </Link>
      </div>
    </header>
  )
}
