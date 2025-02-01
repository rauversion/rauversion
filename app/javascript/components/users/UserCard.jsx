import React from 'react'
import { Link } from 'react-router-dom'

export default function UserCard({ user }) {
  return (
    <Link to={`/${user.username}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-square overflow-hidden rounded-full mb-4">
          <img
            src={user.avatar_url.medium}
            alt={user.full_name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <h3 className="text-lg font-bold text-center mb-1">
          {user.full_name}
        </h3>
      </div>
    </Link>
  )
}
