import React from 'react'
import { Link } from 'react-router-dom'

const PlayButton = ({ size = 'small' }) => (
  <button className="bg-primary/90 rounded-full hover:scale-105 transition-transform">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="white" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`lucide lucide-play ${size === 'large' ? 'p-4 w-6 h-6' : 'p-2 w-4 h-4'}`}
    >
      <polygon points="6 3 20 12 6 21 6 3"></polygon>
    </svg>
  </button>
)

const AlbumCard = ({ album, isLarge = false }) => {
  const albumPath = album.releases?.length > 0 ? `/albums/${album.releases[0].slug}` : `/playlists/${album.slug}`

  return (
    <Link to={albumPath}>
      <div className={`group cursor-pointer relative overflow-hidden rounded-xl bg-muted ${
        isLarge ? 'col-span-2 lg:col-span-2 aspect-[16/8]' : 'aspect-square col-span-1'
      }`}>
        <img 
          src={album.cover_url.medium} 
          alt={album.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 p-4">
            <div className="flex items-center gap-3">
              <PlayButton size={isLarge ? 'large' : 'small'} />
              <div>
                <h3 className={`font-bold mb-0.5 ${isLarge ? 'text-2xl' : 'text-base'}`}>
                  {album.title}
                </h3>
                <p className="text-sm text-muted">
                  {album.user.full_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function AlbumReleases({ albums }) {
  if (!albums || albums.length === 0) return null

  return (
    <section className="px-4 sm:px-8 py-12 md:py-24 bg-gradient-to-b from-muted to-default">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
          New Releases
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {albums.map((album, index) => (
            <AlbumCard 
              key={album.id} 
              album={album} 
              isLarge={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
