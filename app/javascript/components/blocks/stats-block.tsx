"use client"

import React from "react"
import type { StatsBlock as StatsBlockType, Stat } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { useEffect, useState, useRef } from "react"
import { Play, Users, Globe, Award, Music, Headphones, Heart, TrendingUp } from "lucide-react"

interface StatsBlockProps {
  block: StatsBlockType
  isEditing?: boolean
}

const iconMap: Record<string, React.ReactNode> = {
  play: <Play className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  globe: <Globe className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
  music: <Music className="h-6 w-6" />,
  headphones: <Headphones className="h-6 w-6" />,
  heart: <Heart className="h-6 w-6" />,
  trending: <TrendingUp className="h-6 w-6" />,
}

function AnimatedNumber({ value, animate }: { value: string; animate: boolean }) {
  const [displayValue, setDisplayValue] = useState(animate ? "0" : value)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!animate || hasAnimated.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          hasAnimated.current = true
          
          // Extract numeric part
          const numericMatch = value.match(/[\d.]+/)
          if (!numericMatch) {
            setDisplayValue(value)
            return
          }

          const targetNum = parseFloat(numericMatch[0])
          const prefix = value.slice(0, value.indexOf(numericMatch[0]))
          const suffix = value.slice(value.indexOf(numericMatch[0]) + numericMatch[0].length)
          const duration = 2000
          const steps = 60
          const stepDuration = duration / steps
          let currentStep = 0

          const interval = setInterval(() => {
            currentStep++
            const progress = currentStep / steps
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentNum = targetNum * easeOut

            if (targetNum >= 1000) {
              setDisplayValue(`${prefix}${Math.round(currentNum).toLocaleString()}${suffix}`)
            } else if (Number.isInteger(targetNum)) {
              setDisplayValue(`${prefix}${Math.round(currentNum)}${suffix}`)
            } else {
              setDisplayValue(`${prefix}${currentNum.toFixed(1)}${suffix}`)
            }

            if (currentStep >= steps) {
              clearInterval(interval)
              setDisplayValue(value)
            }
          }, stepDuration)

          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value, animate])

  return <span ref={ref}>{displayValue}</span>
}

export function StatsBlock({ block, isEditing }: StatsBlockProps) {
  const { variant, stats, animate, columns } = block.props

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  }

  if (stats.length === 0 && isEditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Agrega estadisticas</p>
      </div>
    )
  }

  const renderStat = (stat: Stat) => (
    <>
      {stat.prefix && <span className="text-primary">{stat.prefix}</span>}
      <AnimatedNumber value={stat.value} animate={animate && !isEditing} />
      {stat.suffix && <span className="text-primary">{stat.suffix}</span>}
    </>
  )

  switch (variant) {
    case "cards":
      return (
        <div className={cn("grid gap-4", columnClasses[columns])}>
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="bg-card border border-border rounded-xl p-6 text-center"
            >
              {stat.icon && iconMap[stat.icon] && (
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  {iconMap[stat.icon]}
                </div>
              )}
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {renderStat(stat)}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )

    case "inline":
      return (
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat, index) => (
            <div key={stat.id} className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-bold">
                  {renderStat(stat)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
              {index < stats.length - 1 && (
                <div className="hidden md:block w-px h-16 bg-border" />
              )}
            </div>
          ))}
        </div>
      )

    case "circles":
      return (
        <div className={cn("grid gap-6", columnClasses[columns])}>
          {stats.map((stat) => (
            <div key={stat.id} className="flex flex-col items-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
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
                    strokeDasharray="283"
                    strokeDashoffset="70"
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold">
                    {renderStat(stat)}
                  </span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground mt-2 text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )

    case "counters":
      return (
        <div className={cn("grid gap-4", columnClasses[columns])}>
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              {stat.icon && iconMap[stat.icon] && (
                <div className="text-primary/50 mb-2">
                  {iconMap[stat.icon]}
                </div>
              )}
              <div className="text-4xl md:text-5xl font-bold mb-1 relative">
                {renderStat(stat)}
              </div>
              <div className="text-sm text-muted-foreground relative">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}
