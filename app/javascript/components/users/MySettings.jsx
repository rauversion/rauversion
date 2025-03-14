import React from "react"
import { useParams, Link, Outlet, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { 
  User, Mail, Bell, Link as LinkIcon, Podcast, 
  CreditCard, Users, Settings2, ChevronRight 
} from 'lucide-react'
import { cn } from "@/lib/utils"

const menuIcons = {
  profile: User,
  email: Mail,
  notifications: Bell,
  social_links: LinkIcon,
  podcast: Podcast,
  transbank: CreditCard,
  invitations: Users,
  integrations: Settings2
}

export default function MySettings() {
  const { username } = useParams()
  const location = useLocation()
  const [user, setUser] = React.useState(null)
  const [menuItems, setMenuItems] = React.useState([])
  const currentSection = location.pathname.split('/').slice(-1)[0] || 'profile'

  React.useEffect(() => {
    const fetchSettings = async () => {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        setUser(data.user)
        setMenuItems(data.menu_items)
      }
    }
    fetchSettings()
  }, [username])

  if (!user) return null

  return (
    <div className="container mx-auto py-10">
      <div className="flex gap-6">
        <aside className="w-72 shrink-0">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = menuIcons[item.namespace] || Settings2
                  const isActive = currentSection === item.namespace || 
                                 (currentSection === "settings" && item.namespace === "profile")
                  return (
                    <Link
                      key={item.namespace}
                      to={`/${username}/settings/${item.namespace}`}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className={cn(
                            "text-xs",
                            isActive 
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}>
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        isActive && "rotate-90"
                      )} />
                    </Link>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
