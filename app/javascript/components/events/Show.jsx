import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDateRange } from '../utils/dateHelpers'

export default function EventShow() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/events/${slug}.json`)
        const data = await response.json()
        setEvent(data)
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [slug])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link to="/events" className="text-primary hover:underline">
          Back to events
        </Link>
      </div>
    )
  }

  return (
    <div>
      <header className="relative z-10 pb-11 lg:pt-11">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center sm:justify-between lg:flex-nowrap">
          <div className="order-first -mx-4 flex flex-auto basis-full overflow-x-auto whitespace-nowrap border-b border-brand-600/10 py-4 font-mono text-sm text-brand-600 sm:-mx-6 lg:order-none lg:mx-0 lg:basis-auto lg:border-0 lg:py-0">
            <div className="mx-auto flex items-center gap-4 px-4">
              <p>
                {formatDateRange(event.event_start, event.event_ends)} {event.timezone}
              </p>
            </div>
          </div>

          <div className="hidden sm:mt-10 sm:flex lg:mt-0 lg:grow lg:basis-0 lg:justify-end">
            <Link
              to={`/events/${event.slug}/purchases/new`}
              className="inline-flex justify-center rounded-2xl bg-brand-600 p-4 text-base font-semibold text-white hover:bg-brand-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:text-white/70"
            >
              Get tickets
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="relative pt-10 pb-20 sm:py-24">
          <div className="absolute inset-x-0 -top-40 -bottom-14 overflow-hidden bg-black">
            {event.cover_image && (
              <img
                src={event.cover_image}
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
                    {event.participant_label || "Speakers"}
                  </dt>
                  <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                    {event.event_hosts_count}
                  </dd>
                </div>

                <div>
                  <dt className="font-mono text-sm text-brand-600">
                    People Attending
                  </dt>
                  <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                    {event.attendees_count}
                  </dd>
                </div>

                <div>
                  <dt className="font-mono text-sm text-brand-600">
                    Venue
                  </dt>
                  <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                    {event.venue}
                  </dd>
                </div>

                <div>
                  <dt className="font-mono text-sm text-brand-600">
                    Location
                  </dt>
                  <dd className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-brand-100">
                    {event.city}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {event.event_hosts?.length > 0 && (
          <section id="speakers" aria-labelledby="speakers-title" className="py-20 sm:py-32 bg-black">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:mx-0">
                <h2
                  id="speakers-title"
                  className="font-display text-4xl font-medium tracking-tighter text-brand-600 sm:text-5xl"
                >
                  {event.participant_label}
                </h2>
                <p className="mt-4 font-display text-2xl tracking-tight text-brand-100">
                  {event.participant_description}
                </p>
              </div>

              <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                {event.event_hosts.map((host, index) => (
                  <div key={index} className="group relative">
                    <div className="aspect-h-3 aspect-w-3 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={host.avatar}
                        alt={host.name}
                        className="object-cover object-center"
                      />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-8 tracking-tight text-brand-100">
                      {host.name}
                    </h3>
                    {host.event_manager && (
                      <p className="text-base leading-7 text-brand-600">Event Manager</p>
                    )}
                    <p className="mt-4 text-sm leading-6 text-brand-100">{host.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {event.event_schedules?.length > 0 && (
          <section aria-label="Schedule" className="py-20 sm:py-32 bg-black">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-4xl lg:pr-24">
                <h2 className="font-display text-4xl font-medium tracking-tighter text-brand-600 sm:text-5xl">
                  {event.scheduling_label}
                </h2>
              </div>

              <div className="mt-14 gap-x-8 gap-y-10 lg:grid lg:grid-cols-3">
                {event.event_schedules.map((schedule, index) => (
                  <div key={index} className="relative lg:pl-8 mb-10 lg:mb-0">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl font-semibold tracking-tight text-brand-100">
                        {schedule.name}
                      </h3>
                      <p className="mt-2 text-base leading-7 text-brand-100">
                        {schedule.description}
                      </p>
                      <time className="text-sm text-brand-600">
                        {new Date(schedule.starts_at).toLocaleTimeString()} - {new Date(schedule.ends_at).toLocaleTimeString()}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between md:flex-row">
          <p className="mt-6 text-base dark:text-gray-300 md:mt-0">
            {new Date().getFullYear()} {event.title}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
