import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { get } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"

export default function IntegrationsSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)
  const formRef = React.useRef()

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

  const handleAuth = (url) => {
    formRef.current.action = url
    formRef.current.submit()
  }

  if (!user) return null

  const findCredential = (provider) => {
    return user.oauth_credentials?.find(
      (cred) => cred.provider === provider
    )
  }

  const integrations = [
    {
      name: "Google OAuth2",
      description: "Connect with Google for authentication and additional features.",
      icon: Icons.google,
      provider: "google_oauth2",
      connected: findCredential("google_oauth2"),
      connectUrl: "/users/auth/google_oauth2",
      disconnectUrl: "/users/auth/google_oauth2/disconnect",
    },
    
    {
      name: "Zoom",
      description: "Integrate with Zoom for live streaming and webinars.",
      icon: Icons.zoom,
      provider: "zoom",
      connected: findCredential("zoom"),
      connectUrl: "/users/auth/zoom",
      disconnectUrl: "/users/auth/zoom/disconnect",
    },
    {
      name: "Discord",
      description: "Connect your Discord server for community engagement.",
      icon: Icons.discord,
      provider: "discord",
      connected: findCredential("discord"),
      connectUrl: "/users/auth/discord",
      disconnectUrl: "/users/auth/discord/disconnect",
    },
    {
      name: "Twitch",
      description: "Stream directly to your Twitch channel.",
      icon: Icons.twitch,
      provider: "twitch",
      connected: findCredential("twitch"),
      connectUrl: "/users/auth/twitch",
      disconnectUrl: "/users/auth/twitch/disconnect",
    },
    {
      name: "Stripe Connect",
      description: "Accept payments and manage your earnings.",
      icon: Icons.stripe,
      provider: "stripe_connect",
      connected: findCredential("stripe_connect"),
      connectUrl: "/users/auth/stripe_connect",
      disconnectUrl: "/users/auth/stripe_connect/disconnect",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hidden form for POST requests */}
      <form ref={formRef} method="post" className="hidden">
        <input
          type="hidden"
          name="authenticity_token"
          value={document.querySelector("[name='csrf-token']")?.content}
        />
      </form>

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
                        Connected with ID: {credential.uid}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {credential ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAuth(integration.disconnectUrl)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAuth(integration.connectUrl)}
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
