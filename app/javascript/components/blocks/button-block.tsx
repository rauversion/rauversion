"use client"

import React from "react"
import type { ButtonBlock as ButtonBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  ExternalLink,
  Play,
  Download,
  Music,
} from "lucide-react"

interface ButtonBlockProps {
  block: ButtonBlockType
  isEditing?: boolean
}

const iconMap = {
  "arrow-right": ArrowRight,
  "external-link": ExternalLink,
  play: Play,
  download: Download,
  music: Music,
  none: null,
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
  xl: "px-10 py-5 text-xl",
}

const iconSizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
}

export function ButtonBlock({ block, isEditing = false }: ButtonBlockProps) {
  const { text, variant, size, href, icon, iconPosition, fullWidth, alignment } = block.props
  
  const IconComponent = icon && icon !== "none" ? iconMap[icon] : null
  
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  // Base button styles
  const baseClasses = cn(
    "inline-flex items-center gap-2 font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
    sizeClasses[size],
    fullWidth && "w-full justify-center"
  )

  // Variant-specific styles
  const variantClasses = {
    default: cn(
      "bg-primary text-primary-foreground rounded-md",
      "hover:bg-primary/90 active:scale-[0.98]",
      "shadow-sm hover:shadow-md"
    ),
    outline: cn(
      "border-2 border-primary text-primary bg-transparent rounded-md",
      "hover:bg-primary hover:text-primary-foreground",
      "active:scale-[0.98]"
    ),
    ghost: cn(
      "text-primary bg-transparent rounded-md",
      "hover:bg-primary/10",
      "active:bg-primary/20"
    ),
    gradient: cn(
      "text-white rounded-md",
      "bg-gradient-to-r from-primary via-primary/80 to-primary",
      "hover:from-primary/90 hover:to-primary/90",
      "shadow-lg hover:shadow-xl active:scale-[0.98]",
      "bg-[length:200%_100%] hover:bg-right transition-all duration-500"
    ),
    glow: cn(
      "bg-primary text-primary-foreground rounded-md",
      "shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]",
      "hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.7)]",
      "active:scale-[0.98] transition-all duration-300"
    ),
    pill: cn(
      "bg-primary text-primary-foreground rounded-full",
      "hover:bg-primary/90 active:scale-[0.98]",
      "shadow-sm hover:shadow-md"
    ),
    "3d": cn(
      "bg-primary text-primary-foreground rounded-md",
      "border-b-4 border-primary/50",
      "hover:border-b-2 hover:translate-y-[2px]",
      "active:border-b-0 active:translate-y-[4px]",
      "transition-all duration-100"
    ),
    minimal: cn(
      "text-foreground bg-transparent",
      "underline-offset-4 hover:underline",
      "active:opacity-70"
    ),
  }

  const buttonContent = (
    <>
      {IconComponent && iconPosition === "left" && (
        <IconComponent className={iconSizeClasses[size]} />
      )}
      <span>{text}</span>
      {IconComponent && iconPosition === "right" && (
        <IconComponent className={iconSizeClasses[size]} />
      )}
    </>
  )

  const buttonElement = (
    <button
      type="button"
      className={cn(baseClasses, variantClasses[variant])}
      onClick={(e) => {
        if (isEditing) {
          e.preventDefault()
          return
        }
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer")
        }
      }}
    >
      {buttonContent}
    </button>
  )

  return (
    <div className={cn("flex w-full", alignmentClasses[alignment])}>
      {isEditing ? (
        buttonElement
      ) : href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(baseClasses, variantClasses[variant])}
        >
          {buttonContent}
        </a>
      ) : (
        buttonElement
      )}
    </div>
  )
}
