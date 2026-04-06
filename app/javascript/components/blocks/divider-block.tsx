"use client"

import React from "react"
import type { DividerBlock as DividerBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface DividerBlockProps {
  block: DividerBlockType
  isEditing?: boolean
}

export function DividerBlock({ block }: DividerBlockProps) {
  const { variant, color, thickness, width, spacing } = block.props

  const spacingClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
    xl: "py-16",
  }

  const widthClasses = {
    full: "w-full",
    medium: "w-2/3 mx-auto",
    short: "w-1/3 mx-auto",
  }

  const thicknessValues = {
    thin: "1px",
    medium: "2px",
    thick: "4px",
  }

  const lineColor = color || "var(--border)"

  switch (variant) {
    case "line":
      return (
        <div className={spacingClasses[spacing]}>
          <hr 
            className={cn(widthClasses[width])}
            style={{ 
              borderColor: lineColor,
              borderTopWidth: thicknessValues[thickness],
            }}
          />
        </div>
      )

    case "dashed":
      return (
        <div className={spacingClasses[spacing]}>
          <hr 
            className={cn(widthClasses[width], "border-dashed")}
            style={{ 
              borderColor: lineColor,
              borderTopWidth: thicknessValues[thickness],
            }}
          />
        </div>
      )

    case "dotted":
      return (
        <div className={spacingClasses[spacing]}>
          <hr 
            className={cn(widthClasses[width], "border-dotted")}
            style={{ 
              borderColor: lineColor,
              borderTopWidth: thicknessValues[thickness],
            }}
          />
        </div>
      )

    case "gradient":
      return (
        <div className={cn(spacingClasses[spacing], "flex justify-center")}>
          <div 
            className={cn(widthClasses[width])}
            style={{ 
              height: thicknessValues[thickness],
              background: `linear-gradient(90deg, transparent, ${color || "var(--primary)"}, transparent)`,
            }}
          />
        </div>
      )

    case "wave":
      return (
        <div className={cn(spacingClasses[spacing], "flex justify-center overflow-hidden")}>
          <svg 
            className={widthClasses[width]}
            height="20" 
            viewBox="0 0 400 20" 
            preserveAspectRatio="none"
          >
            <path
              d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10 T250,10 T300,10 T350,10 T400,10"
              fill="none"
              stroke={lineColor}
              strokeWidth={thicknessValues[thickness]}
            />
          </svg>
        </div>
      )

    case "zigzag":
      return (
        <div className={cn(spacingClasses[spacing], "flex justify-center overflow-hidden")}>
          <svg 
            className={widthClasses[width]}
            height="16" 
            viewBox="0 0 400 16" 
            preserveAspectRatio="none"
          >
            <path
              d="M0,8 L20,0 L40,8 L60,0 L80,8 L100,0 L120,8 L140,0 L160,8 L180,0 L200,8 L220,0 L240,8 L260,0 L280,8 L300,0 L320,8 L340,0 L360,8 L380,0 L400,8"
              fill="none"
              stroke={lineColor}
              strokeWidth={thicknessValues[thickness]}
            />
          </svg>
        </div>
      )

    case "ornament":
      return (
        <div className={cn(spacingClasses[spacing], "flex items-center justify-center gap-4")}>
          <div 
            className="flex-1 max-w-24"
            style={{ 
              height: thicknessValues[thickness],
              background: `linear-gradient(90deg, transparent, ${lineColor})`,
            }}
          />
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
          </div>
          <div 
            className="flex-1 max-w-24"
            style={{ 
              height: thicknessValues[thickness],
              background: `linear-gradient(90deg, ${lineColor}, transparent)`,
            }}
          />
        </div>
      )

    default:
      return null
  }
}
