import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDateRange } from '../utils/dateHelpers'
import I18n from 'stores/locales'
import PurchaseDialog from './PurchaseDialog'
import { Button } from "@/components/ui/button"
import { Link } from 'react-router-dom'

import EventSchedule from './EventSchedule'
import { ArtistCard } from './ArtistCard'

import { ArrowRight } from "lucide-react"
import useAuthStore from "@/stores/authStore"


function TicketButton({ onClick }) {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()

  function handleClick() {
    if (currentUser) {
      onClick()
    } else {
      navigate('/users/sign_in')
    }
  }

  return (
    <button onClick={handleClick} className="group relative overflow-hidden
     bg-white text-black px-8 py-4 rounded-lg 
     transition-all duration-300 hover:scale-105 
     hover:shadow-2xl hover:shadow-white/20 font-mono 
     font-bold text-sm md:text-base flex items-center gap-3">
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
    <div>
      <header className="relative z-10 pb-11 lg:pt-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center sm:justify-between lg:flex-nowrap">
          <div className="order-first -mx-4 flex flex-auto basis-full overflow-x-auto whitespace-nowrap border-b border-brand-600/10 py-4 
          font-mono text-brand-600 sm:-mx-6 lg:order-none lg:mx-0 lg:basis-auto lg:border-0 lg:py-0">
            <div className="mx-auto flex items-center gap-4 px-4">
              <p className="text-2xl font-semibold">
                {event.event_dates_formatted}
                {/*formatDateRange(event.event_start, event.event_ends)*/}
                <br />
                <span className="text-lg font-normal">
                  {event.timezone}
                </span>
              </p>
            </div>
          </div>

          <div className="sm:mt-10 sm:flex lg:mt-0 lg:grow lg:basis-0 lg:justify-end">
            <TicketButton
              onClick={() => setDialogOpen(true)}
              className="inline-flex justify-center rounded-2xl bg-brand-600 p-4 text-base font-semibold text-white hover:bg-brand-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:text-white/70"
            >
              {I18n.t('events.show.get_tickets')}
            </TicketButton>
            <PurchaseDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              eventId={event.slug}
              ticketToken={ticketToken}
            />
          </div>
        </div>
      </header>

      <main>
        <div className="relative pt-10 pb-20 sm:py-24">
          <div className="absolute inset-x-0 -top-32 -bottom-14 overflow-hidden bg-black">
            {event.cover_url && (
              <img
                src={event.cover_url.large}
                alt={event.title}
                width="918"
                height="1495"
                decoding="async"
                data-nimg="1"
                className="absolute top-0 left-0 translate-y-[-10%] translate-x-[-55%] -scale-x-100 sm:left-1/2 sm:translate-y-[-6%] sm:translate-x-[-98%] lg:translate-x-[-106%] xl:translate-x-[-122%] opacity-25"
              />
            )}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black"></div>
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black"></div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="mx-auto max-w-2xl lg:max-w-4xl lg:px-12">
              <h1 className="font-display text-5xl font-bold tracking-tighter text-brand-600 sm:text-7xl">
                {event.title}
              </h1>

              <div className="mt-6 space-y-6 font-display text-2xl tracking-tight text-brand-100">
                {event.description}
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-y-6 gap-x-10 sm:mt-16 sm:gap-y-10 sm:gap-x-16 sm:text-center lg:auto-cols-auto lg:grid-flow-col lg:grid-cols-none lg:justify-start lg:text-left">
                <div>
                  <dt className="font-mono text-sm text-brand-600">
                    {event.participant_label || I18n.t('events.show.speakers')}
                  </dt>
                  <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                    {event.event_hosts_count}
                  </dd>
                </div>

                {/*<div>
                  <dt className="font-mono text-sm text-brand-600">
                    {I18n.t('events.show.people_attending')}
                  </dt>
                  <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                    {event.attendees_count}
                  </dd>
                </div>*/}

                {event.venue && (
                  <div>
                    <dt className="font-mono text-sm text-brand-600">
                      {I18n.t('events.show.venue')}
                    </dt>
                    <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                      {event.venue}
                    </dd>
                  </div>
                )}

                {event.location && (
                  <div>
                    <dt className="font-mono text-sm text-brand-600">
                      {I18n.t('events.show.location')}
                    </dt>
                    <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                      {event.location}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

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

      <footer className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between md:flex-row">
          <p className="mt-6 text-base dark:text-muted-foreground md:mt-0">
            {new Date().getFullYear()} {event.title}. {I18n.t('events.show.all_rights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
