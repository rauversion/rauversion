import React from "react"
import { useParams, Link } from "react-router-dom"
import { get } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Pencil, ExternalLink } from "lucide-react"

export default function ReleasePreview() {
  const { id } = useParams()
  const { toast } = useToast()
  const [release, setRelease] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchRelease = async () => {
      try {
        const response = await get(`/releases/${id}/preview.json`)
        if (response.ok) {
          const data = await response.json
          setRelease(data)
        } else {
          toast({
            title: "Error",
            description: "Could not load release",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching release:", error)
        toast({
          title: "Error",
          description: "Could not load release",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchRelease()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!release) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold">{release.title}</h1>
          {release.subtitle && (
            <p className="text-xl text-muted-foreground mt-2">{release.subtitle}</p>
          )}
        </div>
        {release.urls.edit && (
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to={release.urls.edit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={release.urls.editor}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Editor
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Cover and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="col-span-1">
          {release.cover_url ? (
            <img
              src={release.cover_url}
              alt={release.title}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center"
              style={{ backgroundColor: release.colors.cover }}
            >
              <span className="text-white text-xl">No Cover</span>
            </div>
          )}
        </div>
        <div className="col-span-2">
          {/* Release Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Artist</h3>
              <div className="flex items-center space-x-2 mt-1">
                {release.user.avatar_url ? (
                  <img
                    src={release.user.avatar_url}
                    alt={release.user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : null}
                <span>{release.user.name || release.user.username}</span>
              </div>
            </div>

            {/* External Links */}
            {(release.links.spotify ||
              release.links.bandcamp ||
              release.links.soundcloud) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Listen On</h3>
                <div className="flex space-x-2">
                  {release.links.spotify && (
                    <Button variant="outline" asChild>
                      <a
                        href={release.links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Spotify
                      </a>
                    </Button>
                  )}
                  {release.links.bandcamp && (
                    <Button variant="outline" asChild>
                      <a
                        href={release.links.bandcamp}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Bandcamp
                      </a>
                    </Button>
                  )}
                  {release.links.soundcloud && (
                    <Button variant="outline" asChild>
                      <a
                        href={release.links.soundcloud}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Soundcloud
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playlists */}
      <div className="space-y-8">
        {release.playlists.map((playlist) => (
          <div key={playlist.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{playlist.title}</h2>
              <span className="text-sm text-muted-foreground">
                {playlist.tracks.length} tracks
              </span>
            </div>

            <div className="space-y-2">
              {playlist.tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border"
                >
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(track.duration / 60)}:
                        {String(track.duration % 60).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist.name || track.artist.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
