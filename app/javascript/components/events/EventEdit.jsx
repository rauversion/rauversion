import React from "react";
import { Link, Outlet, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "stores/locales";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Create context for errors
export const EventEditContext = React.createContext(null);

import {
  Settings,
  Calendar,
  Users,
  Ticket,
  Video,
  Users2,
  Mic2,
  LayoutDashboard,
  BarChart3,
  Mail,
  ChevronDown,
  ExternalLink,
  ScanLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileSheetMenu from "@/components/shared/MobileSheetMenu";

export default function EventEdit() {
  const { slug } = useParams();
  const location = useLocation();
  const [event, setEvent] = React.useState(null);
  const [errors, setErrors] = React.useState(null);
  const { i18n } = useLocaleStore;
  const eventViewPath = `/events/${slug}`;
  const eventAdmissionPath = `/events/${slug}/admission`;

  const menuItems = [
    {
      title: i18n.t("events.edit.overview"),
      icon: LayoutDashboard,
      path: "",
    },
    {
      title: i18n.t("events.edit.schedule.title"),
      icon: Calendar,
      path: "schedule",
      description: i18n.t("events.edit.schedule.description"),
    },
    {
      title: i18n.t("events.edit.teams.title"),
      icon: Users,
      path: "teams",
      description: i18n.t("events.edit.teams.description"),
    },
    {
      title: i18n.t("events.edit.tickets.title"),
      icon: Ticket,
      path: "tickets",
      description: i18n.t("events.edit.tickets.description"),
    },
    {
      title: i18n.t("events.edit.email_lists.title", { defaultValue: "Email Lists" }),
      icon: Mail,
      path: "email-lists",
      description: i18n.t("events.edit.email_lists.description", { defaultValue: "Manage email lists for restricted ticket access" }),
    },
    {
      title: i18n.t("events.edit.streaming.title"),
      icon: Video,
      path: "streaming",
      description: i18n.t("events.edit.streaming.description"),
    },
    {
      title: i18n.t("events.edit.attendees.title"),
      icon: Users2,
      path: "attendees",
      description: i18n.t("events.edit.attendees.description"),
    },
    {
      title: i18n.t("events.edit.recordings.title"),
      icon: Mic2,
      path: "recordings",
      description: i18n.t("events.edit.recordings.description"),
    },
    {
      title: i18n.t("events.edit.reports.title"),
      icon: BarChart3,
      path: "reports",
      description: i18n.t("events.edit.reports.description"),
    },
    {
      title: i18n.t("events.edit.settings.title"),
      icon: Settings,
      path: "settings",
      description: i18n.t("events.edit.settings.description"),
    },
  ];

  React.useEffect(() => {
    // TODO: Fetch event data
  }, [slug]);

  const isSelectedMenuItem = (item, currentLocation = location) => {
    if (item.path === "") {
      return currentLocation.pathname === eventViewPath ||
        currentLocation.pathname === `${eventViewPath}/edit`;
    }

    return currentLocation.pathname.endsWith(`/${item.path}`);
  };

  return (
    <div className="container mx-auto py-6">
      {errors && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {typeof errors === "string"
              ? errors
              : Object.entries(errors).map(([key, value]) => (
                <div key={key}>{`${key}: ${value}`}</div>
              ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex items-center justify-between px-2 md:px-0">
        <Breadcrumb className="flex items-center">
          <BreadcrumbItem>
            <BreadcrumbLink href="/events/mine">
              {i18n.t("events.edit.breadcrumb.events")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="flex items-center" />
          <BreadcrumbItem>
            <BreadcrumbPage>{event?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {i18n.t("events.edit.quick_links.label", { defaultValue: "Accesos" })}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                {i18n.t("events.edit.quick_links.title", { defaultValue: "Ir a" })}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={eventViewPath}>
                  <ExternalLink className="h-4 w-4" />
                  {i18n.t("events.edit.quick_links.view_event", { defaultValue: "Ver evento" })}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={eventAdmissionPath}>
                  <ScanLine className="h-4 w-4" />
                  {i18n.t("events.admission.title", { defaultValue: "Admisión" })}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <MobileSheetMenu
            menuItems={menuItems}
            basePath={eventViewPath}
            menuTitle={i18n.t("events.edit.breadcrumb.events")}
            isSelectedFn={isSelectedMenuItem}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-64 shrink-0">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = isSelectedMenuItem(item);

              return (
                <Button
                  key={item.path}
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    "hover:bg-muted dark:hover:bg-secondary",
                    isSelected && "bg-muted dark:bg-secondary"
                  )}
                  asChild
                >
                  <Link to={item.path}>
                    <Icon
                      className={cn("h-4 w-4", isSelected && "text-primary")}
                    />
                    <span className={cn(isSelected && "font-medium")}>
                      {item.title}
                    </span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-card">
          <EventEditContext.Provider value={{ errors, setErrors }}>
            <Outlet />
          </EventEditContext.Provider>
        </div>
      </div>
    </div>
  );
}
