import React from 'react'
import { Link } from 'react-router-dom'

export default function PlaylistCard({ playlist }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-neutral-900">
        <img
          src={playlist.cover_url.medium}
          alt={playlist.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-3 right-3 bg-primary p-2 rounded-full">
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
            className="lucide lucide-list-music w-4 h-4"
          >
            <path d="M21 15V6"></path>
            <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
            <path d="M12 12H3"></path>
            <path d="M16 6H3"></path>
            <path d="M12 18H3"></path>
          </svg>
        </div>
      </div>
      <h3 className="font-bold mb-1">
        {playlist.title}
      </h3>
      <p className="text-sm text-gray-400">
        By {playlist.user.username} • {playlist.tracks.length} tracks
      </p>
    </div>
  )
}
