import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { 
  Facebook, Twitter, Instagram, Youtube, 
  Globe, Music, Twitch 
} from 'lucide-react'

export default function SocialLinksSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        setUser(data.user)
      }
    }
    fetchUser()
  }, [username])

  const { register, handleSubmit } = useForm({
    defaultValues: {
      website: user?.website || "",
      facebook_url: user?.facebook_url || "",
      twitter_url: user?.twitter_url || "",
      instagram_url: user?.instagram_url || "",
      youtube_url: user?.youtube_url || "",
      soundcloud_url: user?.soundcloud_url || "",
      twitch_url: user?.twitch_url || "",
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/social_links`, {
        body: JSON.stringify({ user: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your social links have been updated.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your social links.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your social links.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  const socialInputs = [
    { name: "website", label: "Website", icon: Globe },
    { name: "facebook_url", label: "Facebook", icon: Facebook },
    { name: "twitter_url", label: "Twitter", icon: Twitter },
    { name: "instagram_url", label: "Instagram", icon: Instagram },
    { name: "youtube_url", label: "YouTube", icon: Youtube },
    { name: "soundcloud_url", label: "SoundCloud", icon: Music },
    { name: "twitch_url", label: "Twitch", icon: Twitch },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add your social media profiles and website.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {socialInputs.map(({ name, label, icon: Icon }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id={name}
                  type="url"
                  className="pl-10"
                  placeholder={`Your ${label} URL`}
                  {...register(name)}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="submit">Save links</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
