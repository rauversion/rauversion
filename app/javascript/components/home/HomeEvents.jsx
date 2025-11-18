import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import I18n from 'stores/locales'

const EventCard = ({ event }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link to={`/events/${event.slug}`}>
        <div className="relative overflow-hidden rounded-xl bg-secondary h-full">
          {/* Event Image */}
          <div className="aspect-w-16 aspect-h-9 overflow-hidden">
            {event.cover_url ? (
              <img
                src={event.cover_url.medium}
                alt={event.title}
                className="h-48 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-secondary">
                <span className="text-muted-foreground">{I18n.t('events.no_image')}</span>
              </div>
            )}
          </div>

          {/* Event Content */}
          <div className="p-6">
            {/* Online Badge */}
            {event.online && (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300 mb-3">
                {I18n.t('events.online')}
              </span>
            )}

            {/* Event Title */}
            <h3 className="text-xl font-bold text-foreground dark:text-muted mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>

            {/* Event Description */}
            <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2 mb-4">
              {event.description}
            </p>

            {/* Event Date & Location */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <time dateTime={event.event_start}>
                {new Date(event.event_start).toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
              {!event.online && (event.venue || event.city) && (
                <span className="text-sm truncate ml-2">
                  {event.venue || event.city}
                </span>
              )}
            </div>

            {/* Event Author */}
            <div className="mt-4 flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8 rounded-full"
                  src={event.author.avatar_url.small}
                  alt={event.author.name}
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground dark:text-muted">
                  {event.author.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function HomeEvents({ events }) {
  if (!events || events.length === 0) return null

  return (
    <section className="px-4 sm:px-8 py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {I18n.t('home.events.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {I18n.t('home.events.subtitle')}
            </p>
          </motion.div>
          
          <Link to="/events">
            <Button 
              variant="outline" 
              size="lg"
              className="group border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              {I18n.t('home.events.view_all')}
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </motion.svg>
            </Button>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
