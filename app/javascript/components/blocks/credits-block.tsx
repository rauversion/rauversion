"use client"

import React from "react"
import type { CreditsBlock as CreditsBlockType, Credit } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { ExternalLink, Users } from "lucide-react"

interface CreditsBlockProps {
  block: CreditsBlockType
  isEditing?: boolean
}

export function CreditsBlock({ block, isEditing }: CreditsBlockProps) {
  const { variant, credits, title, alignment } = block.props

  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  if (credits.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega creditos al album</p>
      </div>
    )
  }

  const renderCredit = (credit: Credit) => {
    const content = (
      <>
        <span className="text-muted-foreground">{credit.role}</span>
        <span className="font-medium text-foreground">{credit.name}</span>
      </>
    )

    if (credit.link && !isEditing) {
      return (
        <a
          href={credit.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors group"
        >
          {content}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      )
    }

    return <>{content}</>
  }

  switch (variant) {
    case "list":
      return (
        <div className={alignmentClasses[alignment]}>
          {title && (
            <h3 className="text-lg font-semibold mb-6 text-foreground">{title}</h3>
          )}
          <div className="space-y-3">
            {credits.map((credit) => (
              <div key={credit.id} className="flex flex-col gap-0.5">
                {renderCredit(credit)}
              </div>
            ))}
          </div>
        </div>
      )

    case "columns":
      return (
        <div className={alignmentClasses[alignment]}>
          {title && (
            <h3 className="text-lg font-semibold mb-6 text-foreground">{title}</h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {credits.map((credit) => (
              <div key={credit.id} className="flex flex-col gap-0.5">
                {renderCredit(credit)}
              </div>
            ))}
          </div>
        </div>
      )

    case "compact":
      return (
        <div className={alignmentClasses[alignment]}>
          {title && (
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">{title}</h3>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            {credits.map((credit, index) => (
              <span key={credit.id} className="text-sm">
                <span className="text-muted-foreground">{credit.role}:</span>{" "}
                <span className="font-medium">{credit.name}</span>
                {index < credits.length - 1 && <span className="text-muted-foreground/50 ml-6">|</span>}
              </span>
            ))}
          </div>
        </div>
      )

    case "detailed":
      return (
        <div className={alignmentClasses[alignment]}>
          {title && (
            <h3 className="text-2xl font-bold mb-8 text-foreground">{title}</h3>
          )}
          <div className="space-y-6">
            {credits.map((credit) => (
              <div 
                key={credit.id} 
                className="flex items-center justify-between py-4 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground text-sm uppercase tracking-wider">
                  {credit.role}
                </span>
                <span className="font-medium text-lg">
                  {credit.link && !isEditing ? (
                    <a
                      href={credit.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors inline-flex items-center gap-2"
                    >
                      {credit.name}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    credit.name
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
