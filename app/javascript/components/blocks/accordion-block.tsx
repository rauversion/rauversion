"use client"

import React from "react"
import type { AccordionBlock as AccordionBlockType, AccordionItem } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { ChevronDown, HelpCircle } from "lucide-react"
import { useState } from "react"

interface AccordionBlockProps {
  block: AccordionBlockType
  isEditing?: boolean
}

export function AccordionBlock({ block, isEditing }: AccordionBlockProps) {
  const { variant, items, allowMultiple, defaultOpen } = block.props
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen ? [defaultOpen] : [])

  if (items.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <HelpCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega items al acordeon</p>
      </div>
    )
  }

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      )
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]))
    }
  }

  const isOpen = (id: string) => openItems.includes(id)

  switch (variant) {
    case "default":
      return (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {items.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isOpen(item.id) && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen(item.id) ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="p-4 pt-0 text-muted-foreground">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case "bordered":
      return (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                isOpen(item.id) ? "border-primary" : "border-border"
              )}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isOpen(item.id) && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen(item.id) ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="p-4 pt-0 text-muted-foreground border-t border-border">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case "separated":
      return (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={cn(
                  "flex items-center justify-between w-full p-5 text-left transition-colors",
                  isOpen(item.id) ? "bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <span className="font-semibold">{item.title}</span>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isOpen(item.id) ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen(item.id) && "rotate-180"
                    )}
                  />
                </div>
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen(item.id) ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="p-5 pt-0 text-muted-foreground">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case "minimal":
      return (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-3 w-full py-3 text-left group"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isOpen(item.id) && "rotate-180"
                  )}
                />
                <span className={cn(
                  "font-medium transition-colors",
                  isOpen(item.id) ? "text-primary" : "group-hover:text-primary"
                )}>
                  {item.title}
                </span>
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen(item.id) ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="pl-7 pb-3 text-muted-foreground">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}
