import React from 'react'
import { Link } from 'react-router-dom'
import {useInfiniteScroll} from '../../hooks/useInfiniteScroll'
import { Button } from '../ui/button'
import I18n from 'stores/locales'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

function formatEventLocation(event) {
  if (event.online) return I18n.t('events.my_events.location.online')
  if (event.venue) return event.venue
  return I18n.t('events.my_events.location.tbd')
}

function formatEventDate(date) {
  if (!date) return I18n.t('events.my_events.date.tbd')
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

export default function MyEvents() {
  const [tab, setTab] = React.useState('all')
  const {
    items: posts,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/events/mine.json?tab=${tab}`)

  // if (loading && !posts.length) return <div>{I18n.t('events.my_events.loading.initial')}</div>
  if (!posts) return null

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6 my-4">
        <Tabs defaultValue={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">{I18n.t('events.my_events.tabs.all')}</TabsTrigger>
            <TabsTrigger value="drafts">{I18n.t('events.my_events.tabs.drafts')}</TabsTrigger>
            <TabsTrigger value="published">{I18n.t('events.my_events.tabs.published')}</TabsTrigger>
            <TabsTrigger value="manager">{I18n.t('events.my_events.tabs.manager')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-default">
            {I18n.t('events.my_events.title', { tab: tab.charAt(0).toUpperCase() + tab.slice(1) })}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {I18n.t('events.my_events.subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button asChild>
            <Link to="/events/new">
              {I18n.t('events.my_events.new_event')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{I18n.t('events.my_events.table.title')}</TableHead>
                <TableHead>{I18n.t('events.my_events.table.location')}</TableHead>
                <TableHead>{I18n.t('events.my_events.table.start_date')}</TableHead>
                <TableHead>{I18n.t('events.my_events.table.status')}</TableHead>
                <TableHead className="text-right">{I18n.t('events.my_events.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((event, index) => (
                <TableRow 
                  key={event.id} 
                  ref={index === posts.length - 1 ? lastElementRef : null}
                >
                  <TableCell className="font-medium">
                    <div className="w-56 truncate">
                      {event.title || I18n.t('events.my_events.untitled')}
                    </div>
                  </TableCell>
                  <TableCell>{formatEventLocation(event)}</TableCell>
                  <TableCell>{formatEventDate(event.event_start)}</TableCell>
                  <TableCell>{event.state}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{I18n.t('events.my_events.table.actions')}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{I18n.t('events.my_events.table.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/events/${event.slug}/edit`}>
                            {I18n.t('events.my_events.table.menu.edit')}
                          </Link>
                        </DropdownMenuItem>
                        {event.slug && (
                          <DropdownMenuItem asChild>
                            <Link to={`/events/${event.slug}`}>
                              {I18n.t('events.my_events.table.menu.view')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {loading && posts.length > 0 && (
          <div className="py-4 text-center text-muted">
            {I18n.t('events.my_events.loading.more')}
          </div>
        )}
      </div>
    </div>
  )
}
