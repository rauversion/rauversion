import React from "react"
import { Link } from "react-router-dom"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { Button } from "@/components/ui/button"
import { Plus, Play } from "lucide-react"
import { format } from "date-fns"

export default function AlbumsList() {
  const {
    items: albums,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/playlists/albums.json")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-default">Albums</h1>
          <p className="mt-2 text-sm text-muted">
            Browse through your music collection.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button asChild>
            <Link to="/playlists/new?type=album">
              <Plus className="h-4 w-4 mr-2" />
              New Album
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {albums.map((album, index) => (
              <Link
                key={album.id}
                to={`/albums/${album.slug}`}
                ref={index === albums.length - 1 ? lastElementRef : null}
                className="group relative"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url.medium}
                      alt={album.title}
                      className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-default">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {album.user.full_name || album.user.username}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(new Date(album.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-default">No albums</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new album.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/playlists/new?type=album">
                  <Plus className="h-4 w-4 mr-2" />
                  New Album
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
}
