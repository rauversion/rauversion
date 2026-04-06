"use client"

import React from "react"
import type { DiscographyBlock as DiscographyBlockType, Album } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { Disc3, ExternalLink } from "lucide-react"

interface DiscographyBlockProps {
  block: DiscographyBlockType
  isEditing?: boolean
}

export function DiscographyBlock({ block, isEditing }: DiscographyBlockProps) {
  const { variant, albums, title, showYear, showType } = block.props

  if (albums.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <Disc3 className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega albums a la discografia</p>
      </div>
    )
  }

  const typeLabels = {
    album: "Album",
    ep: "EP",
    single: "Single",
  }

  const renderAlbumCover = (album: Album, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-20 h-20",
      md: "w-full aspect-square",
      lg: "w-full aspect-square",
    }

    return (
      <div className={cn("relative bg-muted rounded-lg overflow-hidden group", sizeClasses[size])}>
        {album.cover ? (
          <img
            src={album.cover}
            alt={album.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {album.link && !isEditing && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ExternalLink className="h-8 w-8 text-white" />
          </div>
        )}
      </div>
    )
  }

  const wrapWithLink = (album: Album, children: React.ReactNode) => {
    if (album.link && !isEditing) {
      return (
        <a
          href={album.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {children}
        </a>
      )
    }
    return <>{children}</>
  }

  switch (variant) {
    case "grid":
      return (
        <div>
          {title && (
            <h3 className="text-2xl font-bold mb-8 text-center">{title}</h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div key={album.id} className="group">
                {wrapWithLink(album, (
                  <>
                    {renderAlbumCover(album)}
                    <div className="mt-3">
                      <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {album.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {showYear && <span>{album.year}</span>}
                        {showYear && showType && <span>•</span>}
                        {showType && <span>{typeLabels[album.type]}</span>}
                      </div>
                    </div>
                  </>
                ))}
              </div>
            ))}
          </div>
        </div>
      )

    case "list":
      return (
        <div>
          {title && (
            <h3 className="text-2xl font-bold mb-8">{title}</h3>
          )}
          <div className="space-y-4">
            {albums.map((album) => (
              <div key={album.id}>
                {wrapWithLink(album, (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {album.cover ? (
                        <img
                          src={album.cover}
                          alt={album.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Disc3 className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {album.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {showYear && <span>{album.year}</span>}
                        {showYear && showType && <span>•</span>}
                        {showType && (
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">
                            {typeLabels[album.type]}
                          </span>
                        )}
                      </div>
                    </div>
                    {album.link && !isEditing && (
                      <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )

    case "timeline":
      return (
        <div>
          {title && (
            <h3 className="text-2xl font-bold mb-8 text-center">{title}</h3>
          )}
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            <div className="space-y-12">
              {albums.map((album, index) => (
                <div
                  key={album.id}
                  className={cn(
                    "relative flex items-center gap-8",
                    index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  <div className="flex-1">
                    {wrapWithLink(album, (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group",
                        index % 2 === 0 ? "text-right" : "text-left"
                      )}>
                        <div className="flex items-center gap-4" style={{ flexDirection: index % 2 === 0 ? "row-reverse" : "row" }}>
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            {album.cover ? (
                              <img src={album.cover} alt={album.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Disc3 className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold group-hover:text-primary transition-colors">
                              {album.title}
                            </h4>
                            {showType && (
                              <span className="text-sm text-muted-foreground">
                                {typeLabels[album.type]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {album.year}
                  </div>
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case "featured":
      const [first, ...rest] = albums
      return (
        <div>
          {title && (
            <h3 className="text-2xl font-bold mb-8 text-center">{title}</h3>
          )}
          {first && (
            <div className="mb-8">
              {wrapWithLink(first, (
                <div className="flex flex-col md:flex-row gap-8 items-center bg-card border border-border rounded-2xl p-6 group hover:border-primary/50 transition-colors">
                  <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden flex-shrink-0">
                    {first.cover ? (
                      <img
                        src={first.cover}
                        alt={first.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Disc3 className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-sm text-primary font-medium mb-2">Ultimo Lanzamiento</div>
                    <h4 className="text-3xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {first.title}
                    </h4>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground">
                      {showYear && <span>{first.year}</span>}
                      {showType && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {typeLabels[first.type]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rest.map((album) => (
                <div key={album.id} className="group">
                  {wrapWithLink(album, (
                    <>
                      {renderAlbumCover(album, "md")}
                      <div className="mt-2">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {album.title}
                        </h4>
                        {showYear && (
                          <span className="text-xs text-muted-foreground">{album.year}</span>
                        )}
                      </div>
                    </>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )

    default:
      return null
  }
}
