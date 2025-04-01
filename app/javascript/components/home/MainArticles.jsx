import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import I18n from 'stores/locales'

export default function MainArticles({ posts }) {
  if (!posts || posts.length === 0) return null

  const mainPost = posts[1]
  const sidePosts = posts.slice(2, 5)

  function truncateText(text, maxLength, addEllipsis = true, cutAtWord = true) {
    // Return original text if it's already shorter than maxLength
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    let truncated = text.substring(0, maxLength);
    
    // If cutting at word boundaries is enabled
    if (cutAtWord) {
      // Find the last space within the truncated text
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex !== -1) {
        truncated = truncated.substring(0, lastSpaceIndex);
      }
    }
    
    // Add ellipsis if enabled
    if (addEllipsis) {
      truncated += '...';
    }
    
    return truncated;
  }

  return (
    <section className="px-4 sm:px-8 py-12 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">
            {I18n.t('home.main_articles.latest_publications')}
          </h2>
          <Link 
            to="/articles" 
            className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            {I18n.t('home.main_articles.view_all')}
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
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {mainPost && (
              <article className="group cursor-pointer dark">
                <Link to={`/articles/${mainPost.slug}`}>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-6">
                    <img 
                      src={mainPost.cover_url.large} 
                      alt={mainPost.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                      {mainPost.category && (
                        <span className="inline-block px-3 py-1 bg-primary text-sm font-medium mb-4">
                          {mainPost.category.name}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2 text-foreground">
                        {mainPost.title}
                      </h2>
                      <p className="hidden sm:block text-default mb-4">
                        {truncateText(mainPost.excerpt, 150)}
                      </p>
                      <div className="flex items-center gap-3">
                        <img 
                          src={mainPost.author.avatar_url.medium} 
                          alt={mainPost.author.username}
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        <div>
                          <span className="block font-medium text-foreground">
                            {mainPost.author.username}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(mainPost.created_at), 'MMMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )}
          </div>

          <div className="lg:col-span-4 grid grid-cols-1 gap-8">
            {sidePosts.map(post => (
              <Link key={post.id} to={`/articles/${post.slug}`}>
                <article className="group cursor-pointer flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img 
                      src={post.cover_url.medium} 
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    {post.category && (
                      <span className="text-primary text-sm font-medium">
                        {post.category.name}
                      </span>
                    )}
                    <h3 className="text-lg font-bold mt-1 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(post.created_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
