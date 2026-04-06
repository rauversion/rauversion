"use client"

import React from "react"
import type { MarqueeBlock as MarqueeBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface MarqueeBlockProps {
  block: MarqueeBlockType
  isEditing?: boolean
}

export function MarqueeBlock({ block, isEditing }: MarqueeBlockProps) {
  const { variant, text, speed, direction, pauseOnHover, repeat, size, separator } = block.props

  const speedDuration = {
    slow: "40s",
    normal: "25s",
    fast: "15s",
  }

  const sizeClasses = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-5xl",
    lg: "text-5xl md:text-7xl",
    xl: "text-6xl md:text-9xl",
  }

  const items = Array(repeat).fill(text)

  const renderText = (content: string, index: number) => {
    switch (variant) {
      case "simple":
        return (
          <span key={index} className="inline-flex items-center">
            <span className="font-bold tracking-tight">{content}</span>
            {separator && (
              <span className="mx-4 md:mx-8 text-primary opacity-60">{separator}</span>
            )}
          </span>
        )

      case "gradient":
        return (
          <span key={index} className="inline-flex items-center">
            <span 
              className="font-bold tracking-tight bg-gradient-to-r from-primary via-primary/60 to-primary bg-clip-text text-transparent"
            >
              {content}
            </span>
            {separator && (
              <span className="mx-4 md:mx-8 text-primary opacity-60">{separator}</span>
            )}
          </span>
        )

      case "outlined":
        return (
          <span key={index} className="inline-flex items-center">
            <span 
              className="font-bold tracking-tight"
              style={{
                WebkitTextStroke: "2px currentColor",
                WebkitTextFillColor: "transparent",
              }}
            >
              {content}
            </span>
            {separator && (
              <span className="mx-4 md:mx-8 opacity-40">{separator}</span>
            )}
          </span>
        )

      case "mixed":
        return (
          <span key={index} className="inline-flex items-center">
            {index % 2 === 0 ? (
              <span className="font-bold tracking-tight">{content}</span>
            ) : (
              <span 
                className="font-bold tracking-tight"
                style={{
                  WebkitTextStroke: "2px currentColor",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {content}
              </span>
            )}
            {separator && (
              <span className="mx-4 md:mx-8 text-primary opacity-60">{separator}</span>
            )}
          </span>
        )

      default:
        return null
    }
  }

  return (
    <div 
      className={cn(
        "overflow-hidden whitespace-nowrap py-4",
        pauseOnHover && !isEditing && "hover:[&_div]:animation-pause"
      )}
    >
      <div
        className={cn(
          "inline-flex",
          sizeClasses[size],
          !isEditing && "animate-marquee"
        )}
        style={{
          animationDuration: speedDuration[speed],
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: isEditing ? "paused" : "running",
        }}
      >
        {items.map((item, index) => renderText(item, index))}
        {/* Duplicate for seamless loop */}
        {items.map((item, index) => renderText(item, index + repeat))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .hover\\:[\\&_div\\]:animation-pause:hover div {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
