"use client"

import React from "react"

import type { EventSiteRecord } from "@/lib/event-sites"

const EventSiteContext = React.createContext<EventSiteRecord | null>(null)

interface EventSiteProviderProps {
  value?: EventSiteRecord | null
  children: React.ReactNode
}

export function EventSiteProvider({ value = null, children }: EventSiteProviderProps) {
  return (
    <EventSiteContext.Provider value={value}>
      {children}
    </EventSiteContext.Provider>
  )
}

export function useEventSite() {
  return React.useContext(EventSiteContext)
}
