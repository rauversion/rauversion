import React from 'react'
import TrackCell from '../tracks/TrackCell'

export default function LatestReleases({ releases }) {
  if (!releases || releases.length === 0) return null

  return (
    <section className="bg-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-8">
          Latest Releases
        </h2>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {releases.map(release => (
            <TrackCell key={release.id} track={release} />
          ))}
        </div>
      </div>
    </section>
  )
}
