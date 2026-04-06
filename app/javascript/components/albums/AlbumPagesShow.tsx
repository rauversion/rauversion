"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { Page } from "@/lib/blocks/types"
import { fetchAlbumPages } from "@/lib/release-editor-pages"
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { cn } from "@/lib/utils"
import { Disc3 } from "lucide-react"

export default function AlbumPagesShow() {
  const { id } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      return
    }

    let cancelled = false

    const loadAlbumPages = async () => {
      try {
        const pages = await fetchAlbumPages(id)

        if (cancelled) return

        if (pages.length > 0) {
          setPage(pages[0])
          setIsEmpty(false)
          setNotFound(false)
        } else {
          setPage(null)
          setIsEmpty(true)
          setNotFound(false)
        }
      } catch (error) {
        console.error("Error loading album pages:", error)
        if (!cancelled) {
          setPage(null)
          setIsEmpty(false)
          setNotFound(true)
        }
      }
    }

    loadAlbumPages()

    return () => {
      cancelled = true
    }
  }, [id])

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

  const { style, blocks } = page

  const fontClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[style.fontFamily]

  return (
    <div
      data-template={style.template}
      className={cn(
        "min-h-screen transition-all",
        fontClass,
        style.darkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"
      )}
      style={
        {
          "--color-primary": style.primaryColor,
          "--primary": style.primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-12">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
            <p>Esta pagina no tiene contenido.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} pageStyle={style} isEditing={false} />
            ))}
          </div>
        )}
      </div>

      <footer className="py-8 text-center border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Creado con Release Editor
        </p>
      </footer>
    </div>
  )
}
