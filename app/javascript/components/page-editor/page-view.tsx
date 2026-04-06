"use client"

import React from "react"

import type { Page } from "@/lib/blocks/types"
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { cn } from "@/lib/utils"

interface EditorPageViewProps {
  page: Page
  emptyMessage?: string
  footerText?: string | null
}

export function EditorPageView({
  page,
  emptyMessage = "Esta pagina no tiene contenido.",
  footerText = null,
}: EditorPageViewProps) {
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
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} pageStyle={style} isEditing={false} />
            ))}
          </div>
        )}
      </div>

      {footerText ? (
        <footer className="py-8 text-center border-t border-border/30">
          <p className="text-xs text-muted-foreground">{footerText}</p>
        </footer>
      ) : null}
    </div>
  )
}
