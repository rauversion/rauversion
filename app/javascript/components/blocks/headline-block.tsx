"use client"

import React from "react"
import type { HeadlineBlock as HeadlineBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface HeadlineBlockProps {
  block: HeadlineBlockType
  isEditing?: boolean
}

export function HeadlineBlock({ block }: HeadlineBlockProps) {
  const { props } = block

  const sizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
  }

  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  const subtitleSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-xl",
  }

  const Tag = props.tag

  // Variant: Simple - Clean typography
  if (props.variant === "simple") {
    return (
      <div className={cn("space-y-3 py-4", alignmentClasses[props.alignment])}>
        {props.subtitle && (
          <p className={cn("text-muted-foreground", subtitleSizeClasses[props.size])}>
            {props.subtitle}
          </p>
        )}
        <Tag className={cn("font-bold tracking-tight", sizeClasses[props.size])}>
          {props.text}
        </Tag>
      </div>
    )
  }

  // Variant: Gradient - Text with gradient fill
  if (props.variant === "gradient") {
    return (
      <div className={cn("space-y-3 py-4", alignmentClasses[props.alignment])}>
        {props.subtitle && (
          <p className={cn("text-primary uppercase tracking-[0.2em] font-medium", subtitleSizeClasses[props.size])}>
            {props.subtitle}
          </p>
        )}
        <Tag
          className={cn(
            "font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60",
            sizeClasses[props.size],
            props.animate && "animate-pulse"
          )}
        >
          {props.text}
        </Tag>
      </div>
    )
  }

  // Variant: Outline - Text with stroke/outline effect
  if (props.variant === "outline") {
    return (
      <div className={cn("space-y-3 py-4", alignmentClasses[props.alignment])}>
        {props.subtitle && (
          <p className={cn("text-muted-foreground font-mono", subtitleSizeClasses[props.size])}>
            {props.subtitle}
          </p>
        )}
        <Tag
          className={cn(
            "font-black tracking-tight",
            sizeClasses[props.size]
          )}
          style={{
            WebkitTextStroke: "2px currentColor",
            WebkitTextFillColor: "transparent",
          }}
        >
          {props.text}
        </Tag>
      </div>
    )
  }

  // Variant: Highlight - Text with highlight/mark effect
  if (props.variant === "highlight") {
    const words = props.text.split(" ")
    const midPoint = Math.ceil(words.length / 2)
    const firstHalf = words.slice(0, midPoint).join(" ")
    const secondHalf = words.slice(midPoint).join(" ")

    return (
      <div className={cn("space-y-3 py-4", alignmentClasses[props.alignment])}>
        {props.subtitle && (
          <p className={cn("text-muted-foreground", subtitleSizeClasses[props.size])}>
            {props.subtitle}
          </p>
        )}
        <Tag className={cn("font-bold tracking-tight", sizeClasses[props.size])}>
          {firstHalf}{" "}
          <span className="relative inline-block">
            <span className="relative z-10">{secondHalf}</span>
            <span className="absolute bottom-1 left-0 right-0 h-[0.3em] bg-primary/30 -rotate-1" />
          </span>
        </Tag>
      </div>
    )
  }

  // Variant: Split - Two-line stylized
  if (props.variant === "split") {
    const words = props.text.split(" ")
    const midPoint = Math.ceil(words.length / 2)
    const firstLine = words.slice(0, midPoint).join(" ")
    const secondLine = words.slice(midPoint).join(" ")

    return (
      <div className={cn("space-y-1 py-4", alignmentClasses[props.alignment])}>
        {props.subtitle && (
          <p className={cn("text-primary uppercase tracking-[0.3em] font-medium mb-4", subtitleSizeClasses[props.size])}>
            {props.subtitle}
          </p>
        )}
        <Tag className={cn("font-light tracking-tight block", sizeClasses[props.size])}>
          {firstLine}
        </Tag>
        <span className={cn("font-black tracking-tight text-primary block", sizeClasses[props.size])}>
          {secondLine}
        </span>
      </div>
    )
  }

  // Variant: Animated - With subtle animation
  if (props.variant === "animated") {
    return (
      <div className={cn("space-y-3 py-4 overflow-hidden", alignmentClasses[props.alignment])}>
        {props.subtitle && (
          <p className={cn(
            "text-muted-foreground",
            subtitleSizeClasses[props.size],
            props.animate && "animate-fade-in"
          )}>
            {props.subtitle}
          </p>
        )}
        <Tag
          className={cn(
            "font-bold tracking-tight",
            sizeClasses[props.size],
            props.animate && "animate-in slide-in-from-bottom-4 duration-700"
          )}
        >
          {props.text.split("").map((char, i) => (
            <span
              key={i}
              className={cn(
                "inline-block",
                props.animate && "animate-in fade-in duration-300"
              )}
              style={{ animationDelay: props.animate ? `${i * 30}ms` : undefined }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </Tag>
      </div>
    )
  }

  // Variant: Decorative - With decorative elements
  if (props.variant === "decorative") {
    return (
      <div className={cn("py-8", alignmentClasses[props.alignment])}>
        <div className={cn(
          "inline-block relative",
          props.alignment === "center" && "mx-auto",
          props.alignment === "right" && "ml-auto"
        )}>
          {/* Top decoration */}
          <div className={cn(
            "flex items-center gap-4 mb-4",
            props.alignment === "center" && "justify-center",
            props.alignment === "right" && "justify-end"
          )}>
            <span className="h-px w-12 bg-primary" />
            {props.subtitle && (
              <p className={cn("text-primary uppercase tracking-[0.2em] font-medium", subtitleSizeClasses[props.size])}>
                {props.subtitle}
              </p>
            )}
            <span className="h-px w-12 bg-primary" />
          </div>
          
          <Tag className={cn("font-bold tracking-tight", sizeClasses[props.size])}>
            {props.text}
          </Tag>
          
          {/* Bottom decoration */}
          <div className={cn(
            "flex items-center gap-2 mt-4",
            props.alignment === "center" && "justify-center",
            props.alignment === "right" && "justify-end"
          )}>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span className="h-1 w-8 rounded-full bg-primary/60" />
            <span className="h-1 w-1 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className={cn("py-4", alignmentClasses[props.alignment])}>
      <Tag className={cn("font-bold tracking-tight", sizeClasses[props.size])}>
        {props.text}
      </Tag>
    </div>
  )
}
