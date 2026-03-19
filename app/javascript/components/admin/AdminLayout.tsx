import React from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { adminGetJson } from "./api"
import type { AdminMetaResponse, AdminNavItem } from "./types"
import { useToast } from "@/hooks/use-toast"
import useAuthStore from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Bell,
  CalendarDays,
  Disc3,
  FileText,
  FolderTree,
  Headphones,
  LayoutDashboard,
  Menu,
  Newspaper,
  ShoppingCart,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const icons: Record<string, React.ComponentType<any>> = {
  ShoppingCart,
  Users,
  FolderTree,
  Newspaper,
  FileText,
  Bell,
  Disc3,
  CalendarDays,
  Headphones,
}

function NavItems({ navigation, pathname, onNavigate }: { navigation: AdminNavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const Icon = icons[item.icon || ""] || LayoutDashboard
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`)

        return (
          <NavLink
            key={item.key}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const { toast } = useToast()
  const { currentUser } = useAuthStore()
  const [navigation, setNavigation] = React.useState<AdminNavItem[]>([])

  React.useEffect(() => {
    const loadMeta = async () => {
      try {
        const data = await adminGetJson<AdminMetaResponse>("/api/admin/meta")
        setNavigation(data.navigation)
      } catch (error: any) {
        toast({
          title: "Admin metadata failed",
          description: error.message,
          variant: "destructive",
        })
      }
    }

    loadMeta()
  }, [toast])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar p-6 text-sidebar-foreground lg:flex lg:flex-col">
          <div className="mb-10">
            <Link to="/admin/commerce" className="inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sidebar-foreground/60">Rauversion</p>
                <h1 className="text-xl font-semibold">Admin</h1>
              </div>
            </Link>
          </div>

          <NavItems navigation={navigation} pathname={location.pathname} />

          <div className="mt-auto rounded-3xl border border-sidebar-border bg-sidebar-accent p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-sidebar-foreground/60">Signed in</p>
            <p className="mt-2 text-sm font-medium text-sidebar-accent-foreground">
              {currentUser?.display_name || currentUser?.username || currentUser?.email}
            </p>
            <p className="mt-1 text-xs text-sidebar-foreground/60">{currentUser?.email}</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 border-border bg-sidebar p-0 text-sidebar-foreground">
                    <SheetHeader className="border-b border-sidebar-border p-6 text-left">
                      <SheetTitle className="text-sidebar-foreground">Admin</SheetTitle>
                    </SheetHeader>
                    <div className="p-6">
                      <NavItems navigation={navigation} pathname={location.pathname} />
                    </div>
                  </SheetContent>
                </Sheet>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Control Room</p>
                  <h2 className="text-lg font-semibold text-foreground">Operations</h2>
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">
                  {currentUser?.display_name || currentUser?.username || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
