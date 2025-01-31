import React from 'react'
import UserCard from '../users/UserCard'

export default function FeaturedArtists({ artists }) {
  if (!artists || artists.length === 0) return null

  return (
    <section className="bg-default py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-8">
          Featured Artists
        </h2>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {artists.map(artist => (
            <UserCard key={artist.id} user={artist} />
          ))}
        </div>
      </div>
    </section>
  )
}
