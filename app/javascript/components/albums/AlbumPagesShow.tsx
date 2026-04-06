"use client"

import React, { useEffect, useState } from "react"
import { get } from "@rails/request.js"
import { Navigate, useParams } from "react-router-dom"
import type { Page } from "@/lib/blocks/types"
import { normalizeReleasePages } from "@/lib/release-editor-pages"
import { EditorPageView } from "@/components/page-editor/page-view"
import { Disc3 } from "lucide-react"

export default function AlbumPagesShow() {
  const { id, slug } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [playlistSlug, setPlaylistSlug] = useState<string | null>(null)

  useEffect(() => {
    const albumIdentifier = id || slug

    if (!albumIdentifier) {
      setNotFound(true)
      return
    }

    let cancelled = false

    const loadAlbumPages = async () => {
      try {
        const response = await get(`/albums/${albumIdentifier}.json`, {
          responseKind: "json",
        })

        if (!response.ok) {
          throw new Error("No se pudo cargar el album")
        }

        const album = await response.json
        const pages = normalizeReleasePages(album?.editor_data?.pages)

        if (cancelled) return

        if (pages.length > 0) {
          setPage(pages[0])
          setIsEmpty(false)
          setNotFound(false)
          setPlaylistSlug(null)
        } else if (album?.playlist?.slug) {
          setPage(null)
          setIsEmpty(false)
          setNotFound(false)
          setPlaylistSlug(album.playlist.slug)
        } else {
          setPage(null)
          setIsEmpty(true)
          setNotFound(false)
          setPlaylistSlug(null)
        }
      } catch (error) {
        console.error("Error loading album pages:", error)
        if (!cancelled) {
          setPage(null)
          setIsEmpty(false)
          setNotFound(true)
          setPlaylistSlug(null)
        }
      }
    }

    loadAlbumPages()

    return () => {
      cancelled = true
    }
  }, [id, slug])

  if (playlistSlug) {
    return <Navigate to={`/playlists/${playlistSlug}`} replace />
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Disc3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Album no encontrado</h1>
        <p className="text-muted-foreground">
          El album que buscas no existe o no esta disponible.
        </p>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Disc3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sin paginas publicadas</h1>
        <p className="text-muted-foreground">
          Este album todavia no tiene paginas del editor para mostrar.
        </p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Disc3 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return <EditorPageView page={page} footerText="Creado con Release Editor" />
}
