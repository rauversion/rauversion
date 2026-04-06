"use client"

import React from "react"
import type { CardBlock as CardBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

interface CardBlockProps {
  block: CardBlockType
  isEditing?: boolean
}

export function CardBlock({ block, isEditing }: CardBlockProps) {
  const { variant, title, subtitle, description, image, link, linkText, badge } =
    block.props

  const Wrapper = link && !isEditing ? "a" : "div"
  const wrapperProps = link && !isEditing ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {}

  // Default variant - vertical card
  if (variant === "default") {
    return (
      <Wrapper
        {...wrapperProps}
        className={cn(
          "group block overflow-hidden rounded-xl border bg-card transition-all",
          link && !isEditing && "hover:border-primary/50 hover:shadow-lg cursor-pointer"
        )}
      >
        {image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          {badge && (
            <span className="inline-block px-2 py-0.5 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {description}
            </p>
          )}
          {link && linkText && (
            <div className="mt-3 flex items-center gap-1 text-sm text-primary font-medium">
              {linkText}
              <ExternalLink className="h-3 w-3" />
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // Horizontal variant - side by side
  if (variant === "horizontal") {
    return (
      <Wrapper
        {...wrapperProps}
        className={cn(
          "group flex overflow-hidden rounded-xl border bg-card transition-all",
          link && !isEditing && "hover:border-primary/50 hover:shadow-lg cursor-pointer"
        )}
      >
        {image && (
          <div className="w-1/3 min-w-[120px] overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col justify-center">
          {badge && (
            <span className="inline-block w-fit px-2 py-0.5 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </Wrapper>
    )
  }

  // Featured variant - large hero style
  if (variant === "featured") {
    return (
      <Wrapper
        {...wrapperProps}
        className={cn(
          "group relative block overflow-hidden rounded-2xl transition-all min-h-[300px]",
          link && !isEditing && "hover:shadow-xl cursor-pointer"
        )}
      >
        {image && (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6 text-white">
          {badge && (
            <span className="inline-block w-fit px-3 py-1 mb-3 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {badge}
            </span>
          )}
          <h3 className="font-bold text-2xl">{title}</h3>
          {subtitle && (
            <p className="text-white/80 mt-1">{subtitle}</p>
          )}
          {description && (
            <p className="text-white/70 mt-2 line-clamp-2">{description}</p>
          )}
          {link && linkText && (
            <div className="mt-4 flex items-center gap-1 text-white font-medium">
              {linkText}
              <ExternalLink className="h-4 w-4" />
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // Minimal variant - simple text focused
  if (variant === "minimal") {
    return (
      <Wrapper
        {...wrapperProps}
        className={cn(
          "group block py-4 border-b transition-colors",
          link && !isEditing && "hover:bg-muted/50 cursor-pointer"
        )}
      >
        <div className="flex items-start gap-4">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {description}
              </p>
            )}
          </div>
          {link && (
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          )}
        </div>
      </Wrapper>
    )
  }

  // Glass variant - glassmorphism style
  if (variant === "glass") {
    return (
      <Wrapper
        {...wrapperProps}
        className={cn(
          "group relative block overflow-hidden rounded-2xl transition-all",
          link && !isEditing && "hover:shadow-xl cursor-pointer"
        )}
      >
        {image && (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="relative backdrop-blur-xl bg-background/60 p-6 min-h-[200px] flex flex-col justify-end border border-white/10">
          {badge && (
            <span className="inline-block w-fit px-2 py-0.5 mb-2 text-xs font-medium rounded-full bg-primary/20 text-primary backdrop-blur-sm">
              {badge}
            </span>
          )}
          <h3 className="font-semibold text-xl text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">
              {description}
            </p>
          )}
          {link && linkText && (
            <div className="mt-3 flex items-center gap-1 text-sm text-primary font-medium">
              {linkText}
              <ExternalLink className="h-3 w-3" />
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // Fallback to default
  return null
}
