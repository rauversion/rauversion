"use client"

import React, { useState } from "react"
import type { Page } from "@/lib/blocks/types"
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { cn } from "@/lib/utils"
import { Monitor, Smartphone, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PreviewTabProps {
  page: Page
  previewUrl?: string
}

type ViewMode = "desktop" | "mobile"

export function PreviewTab({ page, previewUrl }: PreviewTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop")
  const [copied, setCopied] = useState(false)

  const { style, blocks } = page

  const fontClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[style.fontFamily]

  const handleCopyLink = () => {
    const absoluteUrl = previewUrl
      ? new URL(previewUrl, window.location.origin).toString()
      : window.location.href

    navigator.clipboard.writeText(absoluteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="h-4 w-4 mr-1" />
            Desktop
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Mobile
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">
            Vista previa - {page.name}
          </span>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copiar link
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={previewUrl || window.location.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir
            </a>
          </Button>
        </div>
      </div>

      {/* Preview container */}
      <div className="flex-1 overflow-auto p-6 bg-[#1a1a1a]">
        <div
          className={cn(
            "mx-auto transition-all duration-300 overflow-hidden",
            viewMode === "desktop" ? "max-w-4xl" : "max-w-sm"
          )}
        >
          {/* Browser chrome mockup */}
          <div className="rounded-t-lg bg-[#2a2a2a] px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-[#1a1a1a] rounded px-3 py-1 text-xs text-muted-foreground text-center truncate">
                {page.name.toLowerCase().replace(/\s+/g, "-")}.release.page
              </div>
            </div>
          </div>

          {/* Preview content */}
          <div
            data-template={style.template}
            className={cn(
              "min-h-[600px] p-8 transition-all rounded-b-lg",
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
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <p className="text-lg font-medium">Tu pagina esta vacia</p>
                <p className="text-sm">Anade algunos bloques en el editor para empezar</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl mx-auto">
                {blocks.map((block) => (
                  <BlockRenderer key={block.id} block={block} isEditing={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
