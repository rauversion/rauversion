import React from 'react'
import { Link } from 'react-router-dom'
import { ShareDialog } from "@/components/ui/share-dialog"
import { cn } from "@/lib/utils"

export default function PlaylistCard({ playlist }) {
  const shareUrl = `${window.location.origin}/${playlist.user.username}/playlists/${playlist.slug}`

  return (
    <div className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-neutral-900">
        <Link to={`/${playlist.user.username}/playlists/${playlist.slug}`}>
          <img
            src={playlist.cover_url.large}
            alt={playlist.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <ShareDialog 
            url={shareUrl}
            title={playlist.title}
            description={`Listen to ${playlist.title} by ${playlist.user.username} on Rauversion`}
          />
          
          <div className="bg-primary p-2 rounded-full">
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
      </div>

      <Link 
        to={`/${playlist.user.username}/playlists/${playlist.slug}`}
        className="block"
      >
        <h3 className="font-bold mb-1 hover:text-primary transition-colors">
          {playlist.title}
        </h3>
        <p className="text-sm text-gray-400">
          By {playlist.user.username} • {playlist.tracks_count} tracks
        </p>
      </Link>
    </div>
  )
}
