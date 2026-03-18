import React from 'react'
import { Link } from 'react-router-dom'
import { getUserDisplayName } from '@/utils/userDisplayName'

export default function UserCard({ user }) {
  const displayName = getUserDisplayName(user)

  return (
    <Link to={`/${user.username}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-square overflow-hidden rounded-full mb-4">
          <img
            src={user.avatar_url.medium}
            alt={displayName}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <h3 className="text-lg font-bold text-center mb-1">
          {displayName}
        </h3>
      </div>
    </Link>
  )
}
