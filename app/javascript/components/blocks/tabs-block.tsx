"use client"

import React from "react"
import type { TabsBlock as TabsBlockType, TabItem } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { LayoutList } from "lucide-react"
import { useState } from "react"

interface TabsBlockProps {
  block: TabsBlockType
  isEditing?: boolean
}

export function TabsBlock({ block, isEditing }: TabsBlockProps) {
  const { variant, items, defaultTab, alignment } = block.props
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id || "")

  if (items.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <LayoutList className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega tabs al bloque</p>
      </div>
    )
  }

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  const activeItem = items.find((item) => item.id === activeTab)

  switch (variant) {
    case "default":
      return (
        <div>
          <div className={cn("flex gap-1 border-b border-border mb-6", alignmentClasses[alignment])}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px",
                  activeTab === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-muted-foreground">
            {activeItem?.content}
          </div>
        </div>
      )

    case "pills":
      return (
        <div>
          <div className={cn("flex gap-2 mb-6 flex-wrap", alignmentClasses[alignment])}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "px-4 py-2 rounded-full font-medium text-sm transition-all",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-muted-foreground">
            {activeItem?.content}
          </div>
        </div>
      )

    case "underline":
      return (
        <div>
          <div className={cn("flex gap-6 mb-6", alignmentClasses[alignment])}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative pb-2 font-medium text-sm transition-colors",
                  activeTab === item.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="text-muted-foreground">
            {activeItem?.content}
          </div>
        </div>
      )

    case "bordered":
      return (
        <div>
          <div className={cn("flex gap-2 p-1 bg-muted rounded-lg mb-6 inline-flex", alignmentClasses[alignment])}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "px-4 py-2 rounded-md font-medium text-sm transition-all",
                  activeTab === item.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-muted-foreground p-4 bg-card border border-border rounded-lg">
            {activeItem?.content}
          </div>
        </div>
      )

    default:
      return null
  }
}
