"use client"
import React from 'react'
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import I18n from '@/stores/locales'

export interface NestedScheduling {
  id: number
  name: string
  start_date: string
  end_date: string
  start_date_formatted: string
  end_date_formatted: string
  short_description?: string
}

export interface Scheduling {
  name: string
  description: string
  start_date: string
  end_date: string
  start_date_formatted: string
  end_date_formatted: string
  schedule_type: string
  id: number
  schedulings: NestedScheduling[]
}

interface EventScheduleProps {
  schedulings: Scheduling[]
}

function formatTimeRange(startISO: string, endISO: string) {
  // Recibe ISO strings como "2025-11-19T01:15:00.000Z" y devuelve "1:15 AM - 2:00 AM" (formato 12 horas)
  if (!startISO || !endISO) return ""

  const startMatch = startISO.match(/T(\d{2}):(\d{2})/)
  const endMatch = endISO.match(/T(\d{2}):(\d{2})/)

  if (!startMatch || !endMatch) return ""

  const format12h = (hourStr: string, minuteStr: string) => {
    let hour = parseInt(hourStr, 10)
    const minutes = minuteStr
    const period = hour >= 12 ? "PM" : "AM"

    if (hour === 0) {
      hour = 12
    } else if (hour > 12) {
      hour = hour - 12
    }

    return `${hour}:${minutes} ${period}`
  }

  const startTime = format12h(startMatch[1], startMatch[2])
  const endTime = format12h(endMatch[1], endMatch[2])

  return `${startTime} - ${endTime}`
}

function ScheduleSession({ session }: { session: NestedScheduling }) {
  const timeRange = formatTimeRange(session.start_date, session.end_date)

  return (
    <div className="group relative overflow-hidden border-t border-border/40 bg-card/20 backdrop-blur-sm transition-all hover:bg-card/40">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative grid grid-cols-1 gap-4 p-6 md:grid-cols-[200px_1fr]">
        <div className="font-mono text-sm text-muted-foreground">{timeRange}</div>
        <div className="space-y-2">
          <h4 className="text-lg font-medium tracking-tight text-foreground">{session.name}</h4>
          {session.short_description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{session.short_description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ScheduleDay({ schedule }: { schedule: Scheduling }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasNestedSchedules = schedule.schedulings.length > 0

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card/50 backdrop-blur-sm transition-all hover:border-border/80">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <button
        onClick={() => hasNestedSchedules && setIsExpanded(!isExpanded)}
        className={cn("relative w-full p-8 text-left transition-all", hasNestedSchedules && "cursor-pointer")}
        disabled={!hasNestedSchedules}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{schedule.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{schedule.start_date_formatted}</p>
            </div>

            {hasNestedSchedules && (
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary/50 transition-transform",
                  isExpanded && "rotate-180",
                )}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {schedule.description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{schedule.description}</p>
          )}

          {hasNestedSchedules && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className="h-px w-8 bg-border" />
              <span>{schedule.schedulings.length} sesiones</span>
            </div>
          )}
        </div>
      </button>

      {hasNestedSchedules && isExpanded && (
        <div className="relative border-t border-border/40">
          {schedule.schedulings.map((session) => (
            <ScheduleSession key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventSchedule({ schedulings }: EventScheduleProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-16 space-y-4">
          <h1 className="text-5xl font-bold tracking-tighter text-foreground md:text-7xl text-balance">
            {I18n.t('events.show.schedule.title')}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {I18n.t('events.show.schedule.description')}
          </p>
        </div>

        <div className="space-y-6">
          {schedulings.map((schedule) => (
            <ScheduleDay key={schedule.id} schedule={schedule} />
          ))}
        </div>
      </div>
    </div>
  )
}
