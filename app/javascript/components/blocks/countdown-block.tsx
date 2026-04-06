"use client"

import React from "react"
import { useState, useEffect } from "react"
import type { CountdownBlock as CountdownBlockType } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"

interface CountdownBlockProps {
  block: CountdownBlockType
  isEditing?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const difference = new Date(targetDate).getTime() - Date.now()
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    expired: false,
  }
}

export function CountdownBlock({ block, isEditing }: CountdownBlockProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => 
    calculateTimeLeft(block.props.targetDate)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(block.props.targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [block.props.targetDate])

  const alignmentClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[block.props.alignment]

  const textAlignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[block.props.alignment]

  if (timeLeft.expired && !isEditing) {
    return (
      <div className={cn("py-8", textAlignClass)}>
        <p className="text-2xl font-bold text-primary animate-pulse">
          {block.props.expiredMessage}
        </p>
      </div>
    )
  }

  const units = [
    { value: timeLeft.days, label: "Dias", show: block.props.showDays },
    { value: timeLeft.hours, label: "Horas", show: block.props.showHours },
    { value: timeLeft.minutes, label: "Min", show: block.props.showMinutes },
    { value: timeLeft.seconds, label: "Seg", show: block.props.showSeconds },
  ].filter(u => u.show)

  const renderVariant = () => {
    switch (block.props.variant) {
      case "cards":
        return (
          <div className={cn("flex gap-3 md:gap-4", alignmentClass)}>
            {units.map((unit, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-card border border-border rounded-xl p-4 md:p-6 min-w-[70px] md:min-w-[90px] shadow-lg"
              >
                <span className="text-3xl md:text-5xl font-bold text-foreground tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-xs md:text-sm text-muted-foreground mt-1 uppercase tracking-wider">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )

      case "minimal":
        return (
          <div className={cn("flex gap-2 md:gap-4 items-baseline", alignmentClass)}>
            {units.map((unit, i) => (
              <div key={i} className="flex items-baseline gap-1">
                <span className="text-4xl md:text-6xl font-light text-foreground tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {unit.label.toLowerCase()}
                </span>
                {i < units.length - 1 && (
                  <span className="text-4xl md:text-6xl font-light text-muted-foreground mx-1">:</span>
                )}
              </div>
            ))}
          </div>
        )

      case "flip":
        return (
          <div className={cn("flex gap-2 md:gap-4", alignmentClass)}>
            {units.map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative">
                  <div className="bg-card rounded-lg overflow-hidden shadow-xl">
                    <div className="bg-gradient-to-b from-card to-muted px-4 py-3 md:px-6 md:py-4">
                      <span className="text-4xl md:text-6xl font-bold text-foreground tabular-nums block">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-border/50" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )

      case "circles":
        return (
          <div className={cn("flex gap-4 md:gap-6", alignmentClass)}>
            {units.map((unit, i) => {
              const maxValue = i === 0 ? 365 : i === 1 ? 24 : 60
              const progress = (unit.value / maxValue) * 100
              const circumference = 2 * Math.PI * 45
              const strokeDashoffset = circumference - (progress / 100) * circumference
              
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative w-20 h-20 md:w-28 md:h-28">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-muted"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-primary transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                    {unit.label}
                  </span>
                </div>
              )
            })}
          </div>
        )

      case "neon":
        return (
          <div className={cn("flex gap-3 md:gap-6", alignmentClass)}>
            {units.map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="relative px-4 py-3 md:px-6 md:py-4 rounded-lg border-2 border-primary"
                  style={{
                    boxShadow: `0 0 12px var(--color-primary), 0 0 24px var(--color-primary), inset 0 0 12px rgba(99, 102, 241, 0.08)`,
                  }}
                >
                  <span 
                    className="text-4xl md:text-6xl font-bold tabular-nums"
                    style={{
                      color: "var(--color-primary)",
                      textShadow: `0 0 6px var(--color-primary), 0 0 14px var(--color-primary)`,
                    }}
                  >
                    {String(unit.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-primary/80 mt-2 uppercase tracking-widest font-medium">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )

      case "gradient":
        return (
          <div className={cn("flex gap-3 md:gap-4", alignmentClass)}>
            {units.map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-1">
                  <div className="bg-background/80 backdrop-blur rounded-xl px-4 py-3 md:px-6 md:py-4">
                    <span className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent tabular-nums">
                      {String(unit.value).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="py-6">
      {block.props.title && (
        <p className={cn("text-lg md:text-xl text-muted-foreground mb-4", textAlignClass)}>
          {block.props.title}
        </p>
      )}
      
      {renderVariant()}
      
      {block.props.subtitle && (
        <p className={cn("text-sm text-muted-foreground mt-4", textAlignClass)}>
          {block.props.subtitle}
        </p>
      )}
    </div>
  )
}
