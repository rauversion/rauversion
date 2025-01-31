import React from 'react'

export default function Header() {
  return (
    <div className="bg-primary py-4 overflow-hidden">
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        <div className="flex items-center gap-8 text-sm font-medium">
          <span>LATEST RELEASES</span>
          <span>•</span>
          <span>FEATURED ARTISTS</span>
          <span>•</span>
          <span>NEW PLAYLISTS</span>
          <span>•</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium">
          <span>LATEST RELEASES</span>
          <span>•</span>
          <span>FEATURED ARTISTS</span>
          <span>•</span>
          <span>NEW PLAYLISTS</span>
          <span>•</span>
        </div>
      </div>
    </div>
  )
}
