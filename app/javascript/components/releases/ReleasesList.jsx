import React from "react"
import { Link } from "react-router-dom"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Play, ExternalLink } from "lucide-react"
import { format } from "date-fns"

export default function ReleasesList() {
  const {
    items: releases,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/releases.json")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-default">Releases</h1>
          <p className="mt-2 text-sm text-muted">
            A list of all your releases including their title, playlists, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button asChild>
            <Link to="/releases/new">
              <Plus className="h-4 w-4 mr-2" />
              New Release
            </Link>
          </Button>
        </div>
      </div>

      
      <div className="mt-8 flex flex-col">
        {releases && releases.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Playlists</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((release, index) => (
                  <TableRow
                    key={release.id}
                    ref={index === releases.length - 1 ? lastElementRef : null}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {release.cover_url ? (
                          <img
                            src={release.cover_url}
                            alt={release.title}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{release.title}</div>
                          {release.subtitle && (
                            <div className="text-sm text-muted-foreground">
                              {release.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {release.playlists_count} playlists
                        <br />
                        {release.tracks_count} tracks
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {/* Add status badge here */}
                        Published
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(release.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={release.urls.edit}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={release.urls.editor}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-default">No releases</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new release.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/releases/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Release
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
