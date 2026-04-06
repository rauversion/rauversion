"use client"

import React from "react"
import type { HeroBlock as HeroBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { ArrowRight, Play } from "lucide-react"

interface HeroBlockProps {
  block: HeroBlockType
  isEditing?: boolean
}

export function HeroBlock({ block, isEditing }: HeroBlockProps) {
  const { props } = block

  const heightClasses = {
    auto: "min-h-[300px]",
    medium: "min-h-[400px]",
    large: "min-h-[500px] md:min-h-[600px]",
    screen: "min-h-screen",
  }

  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }

  // Variant: Centered - Classic centered hero
  if (props.variant === "centered") {
    return (
      <div
        className={cn(
          "relative flex flex-col justify-center px-6 py-16 md:py-24",
          heightClasses[props.height],
          alignmentClasses[props.alignment]
        )}
        style={{
          backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {props.backgroundImage && (
          <div
            className="absolute inset-0 bg-background"
            style={{ opacity: props.overlayOpacity / 100 }}
          />
        )}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <p className="text-sm md:text-base uppercase tracking-[0.3em] text-primary font-medium">
            {props.subtitle}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            {props.title}
          </h1>
          {props.description && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {props.description}
            </p>
          )}
          {(props.ctaText || props.secondaryCtaText) && (
            <div className={cn(
              "flex flex-wrap gap-4 pt-4",
              props.alignment === "center" && "justify-center",
              props.alignment === "right" && "justify-end"
            )}>
              {props.ctaText && (
                <a
                  href={isEditing ? undefined : props.ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {props.ctaText}
                </a>
              )}
              {props.secondaryCtaText && (
                <a
                  href={isEditing ? undefined : props.secondaryCtaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full font-medium hover:bg-muted transition-colors"
                >
                  {props.secondaryCtaText}
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant: Split - Side by side content and image
  if (props.variant === "split") {
    return (
      <div className={cn("grid md:grid-cols-2 gap-8 md:gap-12 px-6 py-16", heightClasses[props.height])}>
        <div className={cn("flex flex-col justify-center space-y-6", alignmentClasses[props.alignment])}>
          <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium">
            {props.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {props.title}
          </h1>
          {props.description && (
            <p className="text-lg text-muted-foreground">
              {props.description}
            </p>
          )}
          {props.ctaText && (
            <div className="pt-4">
              <a
                href={isEditing ? undefined : props.ctaLink}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                {props.ctaText}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
        <div className="relative aspect-square md:aspect-auto rounded-2xl overflow-hidden bg-muted">
          {props.backgroundImage ? (
            <img
              src={props.backgroundImage}
              alt={props.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Imagen del album
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant: Background - Full background image hero
  if (props.variant === "background") {
    return (
      <div
        className={cn(
          "relative flex flex-col justify-end px-6 py-16",
          heightClasses[props.height]
        )}
        style={{
          backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
        />
        <div className={cn("relative z-10 max-w-4xl space-y-4", alignmentClasses[props.alignment])}>
          <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
            {props.subtitle}
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            {props.title}
          </h1>
          {props.description && (
            <p className="text-lg text-muted-foreground max-w-xl">
              {props.description}
            </p>
          )}
          {props.ctaText && (
            <a
              href={isEditing ? undefined : props.ctaLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:opacity-90 transition-opacity mt-4"
            >
              <Play className="h-5 w-5 fill-current" />
              {props.ctaText}
            </a>
          )}
        </div>
      </div>
    )
  }

  // Variant: Gradient - Animated gradient background
  if (props.variant === "gradient") {
    return (
      <div
        className={cn(
          "relative flex flex-col justify-center px-6 py-16 overflow-hidden",
          heightClasses[props.height],
          alignmentClasses[props.alignment]
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10 animate-pulse" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
            {props.subtitle}
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {props.title}
          </h1>
          {props.description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {props.description}
            </p>
          )}
          {props.ctaText && (
            <div className={cn(
              "flex gap-4 pt-4",
              props.alignment === "center" && "justify-center"
            )}>
              <a
                href={isEditing ? undefined : props.ctaLink}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:scale-105 transition-transform"
              >
                {props.ctaText}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant: Minimal - Clean and simple
  if (props.variant === "minimal") {
    return (
      <div
        className={cn(
          "flex flex-col justify-center px-6 py-24",
          heightClasses[props.height],
          alignmentClasses[props.alignment]
        )}
      >
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <p className="text-primary font-mono text-sm">
              {props.subtitle}
            </p>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              {props.title}
            </h1>
          </div>
          {props.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {props.description}
            </p>
          )}
          {props.ctaText && (
            <a
              href={isEditing ? undefined : props.ctaLink}
              className="inline-flex items-center gap-2 text-primary font-medium group"
            >
              {props.ctaText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
            </a>
          )}
        </div>
      </div>
    )
  }

  // Variant: Album - Designed for music releases
  if (props.variant === "album") {
    return (
      <div className={cn("px-6 py-16", heightClasses[props.height])}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-[400px_1fr] gap-12 items-center">
          {/* Album artwork */}
          <div className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden shadow-2xl shadow-primary/20">
              {props.backgroundImage ? (
                <img
                  src={props.backgroundImage}
                  alt={props.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                  Album Cover
                </div>
              )}
            </div>
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Play className="h-8 w-8 text-primary-foreground fill-current ml-1" />
              </div>
            </div>
          </div>
          {/* Album info */}
          <div className={cn("space-y-6", alignmentClasses[props.alignment])}>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {props.subtitle}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                {props.title}
              </h1>
            </div>
            {props.description && (
              <p className="text-muted-foreground text-lg max-w-lg">
                {props.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-4">
              {props.ctaText && (
                <a
                  href={isEditing ? undefined : props.ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {props.ctaText}
                </a>
              )}
              {props.secondaryCtaText && (
                <a
                  href={isEditing ? undefined : props.secondaryCtaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full font-medium hover:bg-muted transition-colors"
                >
                  {props.secondaryCtaText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="p-8 text-center text-muted-foreground">
      Hero: {props.variant}
    </div>
  )
}
