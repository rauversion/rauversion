import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { formatDateRange } from '../utils/dateHelpers'
import I18n from 'stores/locales'
import PurchaseDialog from './PurchaseDialog'
import { Button } from "@/components/ui/button"

import EventSchedule from './EventSchedule'
import { ArtistCard } from './ArtistCard'

import { ArrowRight } from "lucide-react"
import useAuthStore from "@/stores/authStore"


function TicketButton({ onClick }) {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()

  function handleClick() {
    return onClick()
    if (currentUser) {
      onClick()
    } else {
      navigate('/users/sign_in')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group relative overflow-hidden bg-white text-black px-8 py-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 font-mono font-bold text-sm md:text-base flex items-center gap-3"
    >
      {/* Perforated edge effect - left side */}
      <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-black/60 -translate-x-1" />
        ))}
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 ml-4">
        <span className="tracking-wide">
          {I18n.t('events.show.get_tickets')}
        </span>
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </div>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </button>
  )
}

export default function EventShow() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Get ticket_token from URL params
  const searchParams = new URLSearchParams(window.location.search)
  const ticketToken = searchParams.get('ticket_token')

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/events/${slug}.json`)
        const data = await response.json()
        setEvent(data)

        // If there's a ticket_token in the URL, automatically open the purchase dialog
        if (ticketToken) {
          setDialogOpen(true)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [slug, ticketToken])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{I18n.t('events.loading')}</div>
  }

  console.log('Event data:', slug)

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">{I18n.t('events.show.not_found')}</h1>
        <Link to="/events" className="text-primary hover:underline">
          {I18n.t('events.show.back_to_events')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* HEADER: main event info with square image */}
      <header className="pt-12 pb-10 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch">
            {/* Image */}
            {event.cover_url && (
              <div className="w-full max-w-sm mx-auto lg:mx-0">
                <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                  <img
                    src={event.cover_url.large}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Text content */}
            <div className="flex-1 flex flex-col justify-between gap-6">
              {/* Date / timezone */}
              <div className="font-mono text-sm text-brand-400">
                <p className="text-2xl font-semibold text-brand-100">
                  {event.event_dates_formatted}
                  {/*formatDateRange(event.event_start, event.event_ends)*/}
                </p>
                <p className="text-lg text-brand-500 mt-1">
                  {event.timezone}
                </p>
              </div>

              {/* Title & description */}
              <div>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-brand-50">
                  {event.title}
                </h1>
                <div className="mt-4 space-y-4 font-display text-lg tracking-tight text-brand-100 whitespace-pre-line">
                  {event.description}
                </div>
              </div>

              {/* Stats + ticket button */}
              <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <dl className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm sm:text-base">
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-wide text-brand-500">
                      {event.participant_label || I18n.t('events.show.speakers')}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-brand-100">
                      {event.event_hosts_count}
                    </dd>
                  </div>

                  {event.venue && (
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-wide text-brand-500">
                        {I18n.t('events.show.venue')}
                      </dt>
                      <dd className="mt-1 text-xl font-semibold tracking-tight text-brand-100">
                        {event.venue}
                      </dd>
                    </div>
                  )}

                  {event.location && (
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-wide text-brand-500">
                        {I18n.t('events.show.location')}
                      </dt>
                      <dd className="mt-1 text-xl font-semibold tracking-tight text-brand-100">
                        {event.location}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="flex sm:justify-end">
                  <TicketButton onClick={() => setDialogOpen(true)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={slug}
        ticketToken={ticketToken}
      />

      <main className="flex-1">
        {event.event_hosts?.length > 0 && (
          <section className="w-full py-16">
            <div className="container mx-auto px-4">
              {/* Header */}
              <div className="mb-12 text-center mt-10">
                <h2 className="mb-3 font-sans text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {I18n.t('events.show.speakers')}
                </h2>
                {false && <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{"subtitle"}</p>}
              </div>

              {/* Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {event.event_hosts.map((host, index) => (
                  host.listed_on_page && (
                    <ArtistCard key={host.id} artist={host} />
                  )
                ))}
              </div>
            </div>
          </section>
        )}

        <EventSchedule schedulings={event.event_schedules} />
      </main>

      <footer className="py-16 border-t border-white/10 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between md:flex-row">
          <p className="mt-6 text-base dark:text-muted-foreground md:mt-0">
            {new Date().getFullYear()} {event.title}. {I18n.t('events.show.all_rights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
