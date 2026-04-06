"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { Page } from "@/lib/blocks/types"
import { getCurrentPageId, loadPages } from "@/lib/storage"
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { cn } from "@/lib/utils"
import { Disc3 } from "lucide-react"

export default function PreviewPage() {
  const { id, pageId } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const storageNamespace = id ? `releases2:${id}` : undefined
    const pages = loadPages(storageNamespace)
    const targetPageId = pageId || getCurrentPageId(storageNamespace)
    const found = pages.find((p) => p.id === targetPageId)

    if (found) {
      setPage(found)
      setNotFound(false)
    } else {
      setPage(null)
      setNotFound(true)
    }
  }, [id, pageId])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Disc3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pagina no encontrada</h1>
        <p className="text-muted-foreground">
          La pagina que buscas no existe o ha sido eliminada.
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

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Creado con Release Editor
        </p>
      </footer>
    </div>
  )
}
