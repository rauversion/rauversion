"use client"

import React from "react"

import { emailBlocksByCategory, type EmailBlockRegistryEntry } from "@/lib/email-editor/registry"
import type { EmailBlockType } from "@/lib/email-editor/types"
import { cn } from "@/lib/utils"

function PaletteItem({
  entry,
  onAddBlock,
}: {
  entry: EmailBlockRegistryEntry
  onAddBlock: (type: EmailBlockType) => void
}) {
  const Icon = entry.icon

  return (
    <button
      type="button"
      onClick={() => onAddBlock(entry.type)}
      className={cn("flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent/40")}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.label}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
      </div>
    </button>
  )
}

export function EmailBlockPalette({
  onAddBlock,
}: {
  onAddBlock: (type: EmailBlockType) => void
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contenido</h3>
        <div className="space-y-2">
          {emailBlocksByCategory.content.map((entry) => (
            <PaletteItem key={entry.type} entry={entry} onAddBlock={onAddBlock} />
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</h3>
        <div className="space-y-2">
          {emailBlocksByCategory.layout.map((entry) => (
            <PaletteItem key={entry.type} entry={entry} onAddBlock={onAddBlock} />
          ))}
        </div>
      </section>
    </div>
  )
}
