import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { get } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"
import { format } from "date-fns"

export default function IntegrationsSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          setUser(data.user)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Could not load integration settings.",
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username])

  if (!user) return null

  const findCredential = (provider) => {
    return user.integrations?.oauth_credentials?.find(
      (cred) => cred.provider === provider
    )
  }

  const integrations = [
    {
      name: "Google OAuth2",
      description: "Connect with Google for authentication and additional features.",
      icon: Icons.google,
      provider: "google_oauth2",
      connected: user.integrations?.google_oauth2_connected,
      connectUrl: `/${username}/auth/google_oauth2`,
      disconnectUrl: `/${username}/auth/google_oauth2/disconnect`,
    },
    
    {
      name: "Zoom",
      description: "Integrate with Zoom for live streaming and webinars.",
      icon: Icons.zoom,
      provider: "zoom",
      connected: user.integrations?.zoom_connected,
      connectUrl: `/${username}/auth/zoom`,
      disconnectUrl: `/${username}/auth/zoom/disconnect`,
    },
    {
      name: "Discord",
      description: "Connect your Discord server for community engagement.",
      icon: Icons.discord,
      provider: "discord",
      connected: user.integrations?.discord_connected,
      connectUrl: `/${username}/auth/discord`,
      disconnectUrl: `/${username}/auth/discord/disconnect`,
    },
    {
      name: "Twitch",
      description: "Stream directly to your Twitch channel.",
      icon: Icons.twitch,
      provider: "twitch",
      connected: user.integrations?.twitch_connected,
      connectUrl: `/${username}/auth/twitch`,
      disconnectUrl: `/${username}/auth/twitch/disconnect`,
    },
    {
      name: "Stripe Connect",
      description: "Accept payments and manage your earnings.",
      icon: Icons.stripe,
      provider: "stripe_connect",
      connected: user.integrations?.stripe_connected,
      connectUrl: `/${username}/auth/stripe_connect`,
      disconnectUrl: `/${username}/auth/stripe_connect/disconnect`,
    },
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your account with other services to unlock additional features.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {integrations.map((integration) => {
            const credential = findCredential(integration.provider)
            return (
              <div
                key={integration.name}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-lg border p-2">
                    <integration.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    {credential && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Connected {format(new Date(credential.created_at), "PPP")}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {integration.connected ? (
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = integration.disconnectUrl}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => window.location.href = integration.connectUrl}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
