import React from "react"
import { Link, Outlet, useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import I18n from 'stores/locales'

import {
  Settings,
  Calendar,
  Users,
  Ticket,
  Video,
  Users2,
  Mic2,
  LayoutDashboard
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const menuItems = [
  {
    title: I18n.t('events.edit.overview'),
    icon: LayoutDashboard,
    path: "",
  },
  {
    title: I18n.t('events.edit.schedule.title'),
    icon: Calendar,
    path: "schedule",
    description: I18n.t('events.edit.schedule.description')
  },
  {
    title: I18n.t('events.edit.teams.title'),
    icon: Users,
    path: "teams",
    description: I18n.t('events.edit.teams.description')
  },
  {
    title: I18n.t('events.edit.tickets.title'),
    icon: Ticket,
    path: "tickets",
    description: I18n.t('events.edit.tickets.description')
  },
  {
    title: I18n.t('events.edit.streaming.title'),
    icon: Video,
    path: "streaming",
    description: I18n.t('events.edit.streaming.description')
  },
  {
    title: I18n.t('events.edit.attendees.title'),
    icon: Users2,
    path: "attendees",
    description: I18n.t('events.edit.attendees.description')
  },
  {
    title: I18n.t('events.edit.recordings.title'),
    icon: Mic2,
    path: "recordings",
    description: I18n.t('events.edit.recordings.description')
  },
  {
    title: I18n.t('events.edit.settings.title'),
    icon: Settings,
    path: "settings",
    description: I18n.t('events.edit.settings.description')
  },
]

export default function EventEdit() {
  const { slug } = useParams()
  const [event, setEvent] = React.useState(null)

  React.useEffect(() => {
    // TODO: Fetch event data
  }, [slug])

  return (
    <div className="container mx-auto py-6">
      <Breadcrumb className="mb-6 flex items-center">
        <BreadcrumbItem>
          <BreadcrumbLink to="/events">{I18n.t('events.edit.breadcrumb.events')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="flex items-center" />
        <BreadcrumbItem>
          <BreadcrumbPage>{event?.title || I18n.t('events.loading')}</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                  asChild
                >
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
