import React from 'react'
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ShowMoreTextProps {
  text: string
  maxHeight?: number
  className?: string
  buttonClassName?: string
  showMoreText?: string
  showLessText?: string
}

export function ShowMoreText({
  text,
  maxHeight = 150,
  className,
  buttonClassName,
  showMoreText = "Show more",
  showLessText = "Show less",
}: ShowMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn("w-full", className)}>
      {/* Text container */}
      <div className="relative">
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: isExpanded ? "2000px" : `${maxHeight}px` }}
        >
          <p className="whitespace-pre-line" dangerouslySetInnerHTML={{__html: text}}/>
        </div>

        {/* Gradient overlay - only shown when collapsed */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>

      {/* Button - outside the relative container */}
      <div className="mt-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn("flex items-center gap-1 z-10", buttonClassName)}
        >
          {isExpanded ? (
            <>
              {showLessText} <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              {showMoreText} <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

