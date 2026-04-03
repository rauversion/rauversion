import React from "react";
import { get } from "@rails/request.js";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "stores/locales";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Create context for errors
export const EventEditContext = React.createContext(null);

import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  Mail,
  Mic2,
  ScanLine,
  Settings,
  Ticket,
  Users,
  Users2,
  Video,
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
import Reports from "./sections/Reports";

function EventManagerOverview({ eventAdmissionPath, i18n }) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {i18n.t("events.edit.manager_dashboard.title", { defaultValue: "Panel de gestión" })}
        </AlertTitle>
        <AlertDescription>
          {i18n.t("events.edit.manager_dashboard.description", {
            defaultValue: "Como gestor del evento puedes revisar reportes y operar la admisión, pero no editar la configuración general.",
          })}
        </AlertDescription>
      </Alert>

      <Reports />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            {i18n.t("events.admission.title", { defaultValue: "Admisión" })}
          </CardTitle>
          <CardDescription>
            {i18n.t("events.edit.manager_dashboard.admission_description", {
              defaultValue: "Accede al scanner y al registro de ingresos para validar tickets durante el evento.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            {i18n.t("events.edit.manager_dashboard.admission_hint", {
              defaultValue: "Usa esta vista para escanear QR, registrar ingresos y revisar la actividad reciente.",
            })}
          </p>
          <Button asChild>
            <Link to={eventAdmissionPath}>
              <ScanLine className="h-4 w-4" />
              {i18n.t("events.edit.manager_dashboard.go_to_admission", { defaultValue: "Ir a admisión" })}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventEdit() {
  const { slug } = useParams();
  const location = useLocation();
  const [event, setEvent] = React.useState(null);
  const [errors, setErrors] = React.useState(null);
  const [viewerRole, setViewerRole] = React.useState(null);
  const [loadingAccess, setLoadingAccess] = React.useState(true);
  const [accessError, setAccessError] = React.useState(null);
  const { i18n } = useLocaleStore;
  const eventViewPath = `/events/${slug}`;
  const eventEditPath = `${eventViewPath}/edit`;
  const eventAdmissionPath = `/events/${slug}/admission`;

  const ownerMenuItems = [
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
    let isMounted = true;

    const loadEventAccess = async () => {
      try {
        setLoadingAccess(true);
        setAccessError(null);

        const response = await get(`/events/${slug}/admission.json`);
        const data = await response.json;

        if (!isMounted) return;

        if (response.ok) {
          setEvent(data.event);
          setViewerRole(data.viewer_role || "owner");
          return;
        }

        setAccessError(data.error || i18n.t("events.edit.errors.access", { defaultValue: "No pudimos cargar este panel." }));
      } catch (error) {
        if (!isMounted) return;

        console.error("Error loading event admin access:", error);
        setAccessError(i18n.t("events.edit.errors.access", { defaultValue: "No pudimos cargar este panel." }));
      } finally {
        if (isMounted) {
          setLoadingAccess(false);
        }
      }
    };

    if (slug) {
      loadEventAccess();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const isManagerView = viewerRole === "manager";
  const menuItems = isManagerView
    ? ownerMenuItems.filter((item) => item.path === "reports")
    : ownerMenuItems;
  const normalizedPath = location.pathname.replace(/\/$/, "");
  const managerReportsPath = `${eventEditPath}/reports`;
  const isManagerOverview = isManagerView && normalizedPath === eventEditPath;
  const isAllowedManagerPath = !isManagerView || [eventEditPath, managerReportsPath].includes(normalizedPath);

  const isSelectedMenuItem = (item, currentLocation = location) => {
    if (item.path === "") {
      return currentLocation.pathname === eventViewPath ||
        currentLocation.pathname === eventEditPath;
    }

    return currentLocation.pathname.endsWith(`/${item.path}`);
  };

  if (loadingAccess) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-sm text-muted-foreground">
          {i18n.t("events.edit.loading", { defaultValue: "Cargando panel..." })}
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {i18n.t("events.edit.errors.title", { defaultValue: "No disponible" })}
          </AlertTitle>
          <AlertDescription>{accessError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAllowedManagerPath) {
    return <Navigate to={eventEditPath} replace />;
  }

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
            <BreadcrumbPage>
              {event?.title || i18n.t("events.edit.breadcrumb.loading_event", { defaultValue: "Evento" })}
            </BreadcrumbPage>
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
              {!isManagerView && (
                <DropdownMenuItem asChild>
                  <Link to={eventViewPath}>
                    <ExternalLink className="h-4 w-4" />
                    {i18n.t("events.edit.quick_links.view_event", { defaultValue: "Ver evento" })}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to={eventAdmissionPath}>
                  <ScanLine className="h-4 w-4" />
                  {i18n.t("events.admission.title", { defaultValue: "Admisión" })}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <MobileSheetMenu
            menuItems={menuItems}
            basePath={eventViewPath}
            menuTitle={i18n.t("events.edit.breadcrumb.events")}
            isSelectedFn={isSelectedMenuItem}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="hidden w-64 shrink-0 md:block">
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
                    <Icon className={cn("h-4 w-4", isSelected && "text-primary")} />
                    <span className={cn(isSelected && "font-medium")}>
                      {item.title}
                    </span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-card">
          <EventEditContext.Provider value={{ errors, setErrors }}>
            {isManagerOverview ? (
              <EventManagerOverview eventAdmissionPath={eventAdmissionPath} i18n={i18n} />
            ) : (
              <Outlet />
            )}
          </EventEditContext.Provider>
        </div>
      </div>
    </div>
  );
}
