import React from "react"
import { useParams, Link, Outlet, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import axios from "axios"
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

export function ProfileForm({ user, onSubmit }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: user.username,
      hide_username_from_profile: user.hide_username_from_profile,
      first_name: user.first_name,
      last_name: user.last_name,
      country: user.country,
      city: user.city,
      bio: user.bio,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            This information will be displayed publicly so be careful what you share.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex rounded-md">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                rauversion
              </span>
              <Input
                {...register("username")}
                className="rounded-l-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide_username"
                {...register("hide_username_from_profile")}
              />
              <label
                htmlFor="hide_username"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Hide username from profile page
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input {...register("first_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input {...register("last_name")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input {...register("country")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input {...register("city")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea {...register("bio")} />
          </div>

          <Button type="submit">Save changes</Button>
        </CardContent>
      </Card>
    </form>
  )
}

export default function MySettings() {
  const { username } = useParams()
  const location = useLocation()
  const [user, setUser] = React.useState(null)
  const [menuItems, setMenuItems] = React.useState([])
  const currentSection = location.pathname.split('/').slice(-1)[0] || 'profile'

  React.useEffect(() => {
    axios.get(`/${username}/settings.json`).then((res) => {
      setUser(res.data.user)
      setMenuItems(res.data.menu_items)
    })
  }, [username])

  const handleSubmit = async (data) => {
    try {
      const response = await axios.patch(`/${username}/settings/${currentSection}`, {
        user: data,
      })
      // toast({
      //   title: "Success",
      //   description: "Your settings have been updated.",
      // })
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "There was a problem updating your settings.",
      //   variant: "destructive",
      // })
    }
  }

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
          {currentSection === "profile" && (
            <ProfileForm user={user} onSubmit={handleSubmit} />
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
