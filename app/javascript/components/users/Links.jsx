import React from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import {useInfiniteScroll} from '../../hooks/useInfiniteScroll'
import { Button } from '../ui/button'

export default function UserLinks() {
  const { username } = useParams()
  const { 
    data, 
    isLoading, 
    error 
  } = useInfiniteScroll(`/api/v1/users/${username}/user_links.json`)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  const { user, links } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-muted shadow rounded-lg p-6">
        <div className="flex flex-col items-center justify-between mb-6">
          <div className="relative aspect-square overflow-hidden rounded-full mb-4">
            <img 
              src={user.avatar_url.medium} 
              alt={user.username}
              className="object-cover w-40 h-40 group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <h1 className="text-2xl font-bold text-default py-3">
            {user.social_title}
          </h1>

          <p className="text-sm text-muted pb-4">
            {user.social_description}
          </p>

          {links[0]?.can_edit && (
            <div className="space-x-4">
              <Button asChild variant="default">
                <Link to={`/${username}/links/new`}>
                  Add New Link
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/${username}/links/wizard/new`}>
                  Configure Social Media
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {links.map((link) => (
            <div key={link.id} className="block p-4 bg-default rounded-lg border border-muted">
              <div className="flex items-center justify-between">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 flex-1 hover:opacity-75 transition-opacity duration-200"
                  onClick={() => {
                    // Track click if needed
                    console.log('Link clicked:', link.title, link.url)
                  }}
                >
                  <i className={`${link.icon_class} text-muted`} />
                  <div className="flex flex-col">
                    <span className="font-medium text-default">{link.title}</span>
                    <p className="text-sm text-muted mt-1">{link.url}</p>
                  </div>
                </a>

                {link.can_edit && (
                  <div className="flex space-x-2 text-xs">
                    <Link
                      to={`/${username}/links/${link.id}/edit`}
                      className="text-muted hover:text-default"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        // Handle delete
                        if (window.confirm('Are you sure you want to delete this link?')) {
                          // Delete logic here
                        }
                      }}
                      className="text-muted hover:text-default"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
