"use client"

import React from "react"
import type { PressQuotesBlock as PressQuotesBlockType, PressQuote } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { Quote, Star, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

interface PressQuotesBlockProps {
  block: PressQuotesBlockType
  isEditing?: boolean
}

export function PressQuotesBlock({ block, isEditing }: PressQuotesBlockProps) {
  const { variant, quotes, showRatings, autoplay } = block.props
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (autoplay && !isEditing && quotes.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % quotes.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoplay, isEditing, quotes.length])

  if (quotes.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <Quote className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega quotes de prensa</p>
      </div>
    )
  }

  const renderRating = (rating?: number) => {
    if (!showRatings || !rating) return null
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < rating ? "fill-primary text-primary" : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    )
  }

  const renderQuote = (quote: PressQuote, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "text-base",
      md: "text-lg md:text-xl",
      lg: "text-xl md:text-2xl lg:text-3xl",
    }

    return (
      <>
        <Quote className="h-8 w-8 text-primary/30 mb-4" />
        <blockquote className={cn("italic leading-relaxed mb-4", sizeClasses[size])}>
          &ldquo;{quote.quote}&rdquo;
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          {quote.logo && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted">
              <img src={quote.logo} alt={quote.source} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex flex-col items-center">
            {quote.sourceUrl && !isEditing ? (
              <a
                href={quote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                {quote.source}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="font-semibold">{quote.source}</span>
            )}
            {renderRating(quote.rating)}
          </div>
        </div>
      </>
    )
  }

  switch (variant) {
    case "cards":
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-card border border-border rounded-xl p-6 flex flex-col text-center"
            >
              {renderQuote(quote, "sm")}
            </div>
          ))}
        </div>
      )

    case "minimal":
      return (
        <div className="space-y-8">
          {quotes.map((quote) => (
            <div key={quote.id} className="text-center max-w-3xl mx-auto">
              {renderQuote(quote)}
            </div>
          ))}
        </div>
      )

    case "featured":
      const featured = quotes[0]
      const rest = quotes.slice(1)
      return (
        <div className="space-y-8">
          {featured && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center">
              {renderQuote(featured, "lg")}
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {rest.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  {renderQuote(quote, "sm")}
                </div>
              ))}
            </div>
          )}
        </div>
      )

    case "slider":
      return (
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="w-full flex-shrink-0 text-center px-4 md:px-16"
                >
                  <div className="max-w-3xl mx-auto">
                    {renderQuote(quote, "lg")}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {quotes.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === activeIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )

    default:
      return null
  }
}
