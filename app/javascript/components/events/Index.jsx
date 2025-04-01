import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import I18n from 'stores/locales'

export default function EventsIndex() {
  const [events, setEvents] = useState({ events: [], past_events: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/events.json')
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
    {I18n.t('events.loading')}
    </div>
  }

  return (
    <div className="bg-default">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">
              {I18n.t('events.upcoming')}
            </h2>
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {events.events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          {events.past_events.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">
                {I18n.t('events.past')}
              </h2>
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {events.past_events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }) {
  return (
    <Link to={`/events/${event.slug}`} className="group">
      <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-200">
        {event.cover_url ? (
          <img
            src={event.cover_url.medium}
            alt={event.title}
            className="h-full w-full object-cover object-center group-hover:opacity-75"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <span className="text-gray-400">{I18n.t('events.no_image')}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-base font-medium">
        <h3 className="text-gray-900 dark:text-gray-100">{event.title}</h3>
        <div className="flex flex-col items-end">
          {event.online ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              {I18n.t('events.online')}
            </span>
          ) : (
            <span className="text-sm text-gray-500">{event.venue || event.city}</span>
          )}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {event.description}
        </p>
      </div>
      <div className="mt-6 flex items-center">
        <div className="flex-shrink-0">
          <img
            className="h-10 w-10 rounded-full"
            src={event.author.avatar_url.small}
            alt={event.author.name}
          />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {event.author.name}
          </p>
          <div className="flex space-x-1 text-sm text-gray-500">
            <time dateTime={event.event_start}>
              {new Date(event.event_start).toLocaleDateString()}
            </time>
          </div>
        </div>
      </div>
    </Link>
  )
}
