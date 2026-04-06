"use client"

import React from "react"
import type { MerchGridBlock as MerchGridBlockType, MerchItem } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { ShoppingBag, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useRef } from "react"

interface MerchGridBlockProps {
  block: MerchGridBlockType
  isEditing?: boolean
}

export function MerchGridBlock({ block, isEditing }: MerchGridBlockProps) {
  const { variant, items, title, columns, showPrices, buttonText } = block.props
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  if (items.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega productos de merch</p>
      </div>
    )
  }

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const renderProduct = (item: MerchItem, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "aspect-square",
      md: "aspect-square",
      lg: "aspect-[3/4]",
    }

    return (
      <div
        key={item.id}
        className="group"
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <div className={cn("relative rounded-xl overflow-hidden bg-muted mb-3", sizeClasses[size])}>
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Badge */}
          {item.badge && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
              {item.badge}
            </div>
          )}
          
          {/* Sold Out Overlay */}
          {item.soldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg uppercase tracking-wider">Agotado</span>
            </div>
          )}
          
          {/* Quick Buy Button */}
          {!item.soldOut && item.link && !isEditing && (
            <div className={cn(
              "absolute inset-x-3 bottom-3 transition-all duration-300",
              hoveredId === item.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/90 transition-colors"
              >
                {buttonText}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
        
        <div>
          <h4 className="font-medium truncate group-hover:text-primary transition-colors">
            {item.name}
          </h4>
          {showPrices && (
            <p className={cn(
              "text-sm",
              item.soldOut ? "text-muted-foreground line-through" : "text-primary font-semibold"
            )}>
              {item.price}
            </p>
          )}
        </div>
      </div>
    )
  }

  switch (variant) {
    case "grid":
      return (
        <div>
          {title && (
            <h3 className="text-2xl font-bold mb-8 text-center">{title}</h3>
          )}
          <div className={cn("grid gap-6", columnClasses[columns])}>
            {items.map((item) => renderProduct(item))}
          </div>
        </div>
      )

    case "carousel":
      return (
        <div>
          {title && (
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel("left")}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
          >
            {items.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-64 snap-start">
                {renderProduct(item)}
              </div>
            ))}
          </div>
        </div>
      )

    case "featured":
      const [first, ...rest] = items
      return (
        <div>
          {title && (
            <h3 className="text-2xl font-bold mb-8 text-center">{title}</h3>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {first && (
              <div
                className="group"
                onMouseEnter={() => setHoveredId(first.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
                  {first.image ? (
                    <img
                      src={first.image}
                      alt={first.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {first.badge && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded">
                      {first.badge}
                    </div>
                  )}
                  {first.soldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl uppercase tracking-wider">Agotado</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                    {first.name}
                  </h4>
                  {showPrices && (
                    <p className={cn(
                      "text-lg mb-4",
                      first.soldOut ? "text-muted-foreground line-through" : "text-primary font-bold"
                    )}>
                      {first.price}
                    </p>
                  )}
                  {!first.soldOut && first.link && !isEditing && (
                    <a
                      href={first.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
                    >
                      {buttonText}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {rest.slice(0, 4).map((item) => renderProduct(item, "sm"))}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
