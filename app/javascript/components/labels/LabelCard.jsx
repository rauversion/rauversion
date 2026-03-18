import React from 'react'
import { Link } from 'react-router-dom'
import { getUserDisplayName } from '@/utils/userDisplayName'

export default function LabelCard({ label }) {
  const displayName = getUserDisplayName(label)

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
        <img
          src={label.avatar_url.medium}
          alt={displayName}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-default/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="font-bold mb-1">
        <Link
          to={`/${label.username}`}
          className="hover:text-primary transition-colors"
        >
          {displayName}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground">{label.playlists_count} releases</p>
    </div>
  )
}
