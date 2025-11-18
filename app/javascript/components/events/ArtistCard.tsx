"use client"
import React from "react"
import { useState } from "react"


interface Artist {
  id: string
  name: string
  genre?: string
  image?: string
  bio?: string
  description?: string
  avatar_url?: {
    small?: string
    medium?: string
    large?: string
  }
  user?: {
    avatar_url?: {
      small?: string
      medium?: string
      large?: string
    }
  }
  socialMedia?: {
    instagram?: string
    spotify?: string
  }
}

export function ArtistCard({ artist }: { artist: Artist }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-500 hover:border-accent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {(artist?.avatar_url?.medium || artist?.user?.avatar_url?.medium) ? (
          <img
            src={artist.avatar_url?.medium || artist.user.avatar_url?.medium || "/placeholder.svg"}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-muted to-muted-foreground/10" />
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />

        {/* Animated Border Effect */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: "linear-gradient(45deg, transparent 48%, var(--accent) 50%, transparent 52%)",
            backgroundSize: "20px 20px",
            animation: isHovered ? "borderShine 3s linear infinite" : "none",
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-500">
        {/* Genre Tag */}
        {artist.genre && (
          <div className="mb-3 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-accent backdrop-blur-sm">
            {artist.genre}
          </div>
        )}

        {/* Artist Name */}
        <h3 className="mb-2 font-serif text-3xl font-bold leading-tight text-foreground transition-all duration-300 group-hover:text-accent md:text-4xl">
          {artist.name}
        </h3>

        {/* Bio - Shows on Hover */}
        {artist.description && (
          <p className="mb-4 max-h-0 overflow-hidden text-sm leading-relaxed text-muted-foreground opacity-0 transition-all duration-500 group-hover:max-h-40 group-hover:opacity-100">
            {artist.description}
          </p>
        )}

        {/* Social Links */}
        {artist.socialMedia && (
          <div className="flex gap-3 opacity-0 transition-all duration-500 group-hover:opacity-100">
            {artist.socialMedia.instagram && (
              <a
                href={artist.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent backdrop-blur-sm transition-all hover:bg-accent hover:text-background"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            )}
            {artist.socialMedia.spotify && (
              <a
                href={artist.socialMedia.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent backdrop-blur-sm transition-all hover:bg-accent hover:text-background"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute right-4 top-4 h-12 w-12 rounded-full border border-accent/20 bg-accent/5 opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:opacity-100" />
    </div>
  )
}
