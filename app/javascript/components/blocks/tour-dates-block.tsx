"use client"

import React from "react"
import type { TourDatesBlock as TourDatesBlockType, TourDate } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { MapPin, Calendar, Ticket, ExternalLink, Star } from "lucide-react"

interface TourDatesBlockProps {
  block: TourDatesBlockType
  isEditing?: boolean
}

function formatDate(dateStr: string): { day: string; month: string; year: string; weekday: string; full: string } {
  const date = new Date(dateStr)
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const weekdays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
  
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: months[date.getMonth()],
    year: String(date.getFullYear()),
    weekday: weekdays[date.getDay()],
    full: date.toLocaleDateString("es-ES", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    }),
  }
}

function isPastDate(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now()
}

export function TourDatesBlock({ block, isEditing }: TourDatesBlockProps) {
  const { variant, dates, title, emptyMessage, showPastDates, ticketButtonText } = block.props

  const filteredDates = showPastDates 
    ? dates 
    : dates.filter(d => !isPastDate(d.date))

  const sortedDates = [...filteredDates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  if (sortedDates.length === 0 && !isEditing) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const renderTicketButton = (tour: TourDate) => {
    if (tour.soldOut) {
      return (
        <span className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium">
          Sold Out
        </span>
      )
    }
    
    if (!tour.ticketUrl && !isEditing) {
      return (
        <span className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
          Proximamente
        </span>
      )
    }

    return (
      <a
        href={isEditing ? undefined : tour.ticketUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={isEditing ? (e) => e.preventDefault() : undefined}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Ticket className="w-4 h-4" />
        {ticketButtonText}
      </a>
    )
  }

  const renderDate = (tour: TourDate, index: number) => {
    const dateInfo = formatDate(tour.date)
    const isPast = isPastDate(tour.date)

    switch (variant) {
      case "list":
        return (
          <div
            key={tour.id || index}
            className={cn(
              "flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border border-border transition-colors hover:border-primary/50",
              isPast && "opacity-50",
              tour.featured && "border-primary bg-primary/5"
            )}
          >
            <div className="flex items-center gap-4 md:min-w-[140px]">
              <div className="text-center min-w-[60px]">
                <div className="text-2xl font-bold text-foreground">{dateInfo.day}</div>
                <div className="text-sm text-muted-foreground uppercase">{dateInfo.month}</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-border" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{tour.venue}</h3>
                {tour.featured && <Star className="w-4 h-4 text-primary fill-primary" />}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tour.city}, {tour.country}
              </p>
            </div>

            <div className="md:ml-auto">
              {renderTicketButton(tour)}
            </div>
          </div>
        )

      case "cards":
        return (
          <div
            key={tour.id || index}
            className={cn(
              "relative bg-card border border-border rounded-xl p-6 transition-all hover:shadow-lg hover:border-primary/50",
              isPast && "opacity-50",
              tour.featured && "border-primary ring-2 ring-primary/20"
            )}
          >
            {tour.featured && (
              <div className="absolute -top-3 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                Destacado
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="bg-muted rounded-lg p-3 text-center min-w-[70px]">
                <div className="text-2xl font-bold text-foreground">{dateInfo.day}</div>
                <div className="text-xs text-muted-foreground uppercase">{dateInfo.month}</div>
                <div className="text-xs text-muted-foreground">{dateInfo.year}</div>
              </div>
              {tour.soldOut && (
                <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded">
                  Sold Out
                </span>
              )}
            </div>

            <h3 className="font-semibold text-lg text-foreground mb-1">{tour.venue}</h3>
            <p className="text-muted-foreground flex items-center gap-1 mb-4">
              <MapPin className="w-4 h-4" />
              {tour.city}, {tour.country}
            </p>

            {!tour.soldOut && (
              <a
                href={isEditing ? undefined : tour.ticketUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                {ticketButtonText}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )

      case "timeline":
        return (
          <div
            key={tour.id || index}
            className={cn(
              "relative pl-8 pb-8 last:pb-0",
              isPast && "opacity-50"
            )}
          >
            {/* Timeline line */}
            <div className="absolute left-[11px] top-3 bottom-0 w-px bg-border last:hidden" />
            
            {/* Timeline dot */}
            <div 
              className={cn(
                "absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                tour.featured 
                  ? "border-primary bg-primary" 
                  : "border-border bg-background"
              )}
            >
              {tour.featured && <Star className="w-3 h-3 text-primary-foreground" />}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="text-sm font-medium text-primary min-w-[100px]">
                {dateInfo.weekday}, {dateInfo.day} {dateInfo.month}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{tour.venue}</h3>
                <p className="text-sm text-muted-foreground">
                  {tour.city}, {tour.country}
                </p>
              </div>

              <div>
                {renderTicketButton(tour)}
              </div>
            </div>
          </div>
        )

      case "compact":
        return (
          <div
            key={tour.id || index}
            className={cn(
              "flex items-center gap-3 py-3 border-b border-border last:border-0",
              isPast && "opacity-50"
            )}
          >
            <div className="text-sm font-mono text-muted-foreground min-w-[80px]">
              {dateInfo.day}/{dateInfo.month}
            </div>
            <div className="flex-1 truncate">
              <span className="font-medium text-foreground">{tour.city}</span>
              <span className="text-muted-foreground"> - {tour.venue}</span>
            </div>
            {tour.soldOut ? (
              <span className="text-xs text-muted-foreground">Sold Out</span>
            ) : tour.ticketUrl ? (
              <a
                href={isEditing ? undefined : tour.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
                className="text-primary hover:underline text-sm"
              >
                Tickets
              </a>
            ) : null}
          </div>
        )

      case "featured":
        const nextDate = index === 0 ? sortedDates[0] : null
        if (!nextDate && index === 0) return null
        
        if (index === 0) {
          return (
            <div key={tour.id || index} className="mb-6">
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-1">
                <div className="bg-background rounded-xl p-6 md:p-8">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mb-4">
                    <Calendar className="w-4 h-4" />
                    Proximo show
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="text-center md:text-left">
                      <div className="text-5xl md:text-6xl font-bold text-foreground">{dateInfo.day}</div>
                      <div className="text-xl text-muted-foreground uppercase">{dateInfo.month} {dateInfo.year}</div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-1">{tour.venue}</h3>
                      <p className="text-lg text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {tour.city}, {tour.country}
                      </p>
                    </div>

                    <div>
                      {tour.soldOut ? (
                        <span className="inline-block px-6 py-3 rounded-full bg-muted text-muted-foreground font-medium">
                          Sold Out
                        </span>
                      ) : (
                        <a
                          href={isEditing ? undefined : tour.ticketUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={isEditing ? (e) => e.preventDefault() : undefined}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                        >
                          <Ticket className="w-5 h-5" />
                          {ticketButtonText}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // Render remaining dates in compact style
        return (
          <div
            key={tour.id || index}
            className={cn(
              "flex items-center gap-4 py-3 border-b border-border last:border-0",
              isPast && "opacity-50"
            )}
          >
            <div className="min-w-[60px] text-center">
              <div className="text-lg font-bold text-foreground">{dateInfo.day}</div>
              <div className="text-xs text-muted-foreground uppercase">{dateInfo.month}</div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{tour.venue}</div>
              <div className="text-sm text-muted-foreground">{tour.city}, {tour.country}</div>
            </div>
            {renderTicketButton(tour)}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="py-6">
      {title && (
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      )}
      
      <div className={cn(
        variant === "cards" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        variant === "list" && "space-y-3",
        variant === "timeline" && "space-y-0",
        variant === "compact" && "divide-y divide-border",
        variant === "featured" && "space-y-0"
      )}>
        {sortedDates.map((date, i) => renderDate(date, i))}
      </div>
    </div>
  )
}
