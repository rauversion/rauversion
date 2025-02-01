import React from "react"
import { Link, Outlet, useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
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
    title: "Event Overview",
    icon: LayoutDashboard,
    path: "",
  },
  {
    title: "Schedule",
    icon: Calendar,
    path: "schedule",
    description: "Edit event scheduling"
  },
  {
    title: "Teams & Managers",
    icon: Users,
    path: "teams",
    description: "Add hosts, special guests, and event managers"
  },
  {
    title: "Tickets",
    icon: Ticket,
    path: "tickets",
    description: "Manage the event tickets"
  },
  {
    title: "Streaming",
    icon: Video,
    path: "streaming",
    description: "Manage live streaming sources"
  },
  {
    title: "Attendees",
    icon: Users2,
    path: "attendees",
    description: "View the event's attendees list"
  },
  {
    title: "Recordings",
    icon: Mic2,
    path: "recordings",
    description: "Manage event recordings"
  },
  {
    title: "Settings",
    icon: Settings,
    path: "settings",
    description: "Event settings"
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
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink to="/events">Events</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{event?.title || 'Loading...'}</BreadcrumbPage>
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
