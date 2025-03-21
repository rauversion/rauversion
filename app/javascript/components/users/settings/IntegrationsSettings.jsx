import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { get } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"
import I18n from 'stores/locales'

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
          description: I18n.t('user_settings.integrations.messages.load_error'),
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
      name: I18n.t('user_settings.integrations.providers.google.name'),
      description: I18n.t('user_settings.integrations.providers.google.description'),
      icon: Icons.google,
      provider: "google_oauth2",
      connected: findCredential("google_oauth2"),
      connectUrl: "/users/auth/google_oauth2",
      disconnectUrl: "/users/auth/google_oauth2/disconnect",
    },
    {
      name: I18n.t('user_settings.integrations.providers.zoom.name'),
      description: I18n.t('user_settings.integrations.providers.zoom.description'),
      icon: Icons.zoom,
      provider: "zoom",
      connected: findCredential("zoom"),
      connectUrl: "/users/auth/zoom",
      disconnectUrl: "/users/auth/zoom/disconnect",
    },
    {
      name: I18n.t('user_settings.integrations.providers.discord.name'),
      description: I18n.t('user_settings.integrations.providers.discord.description'),
      icon: Icons.discord,
      provider: "discord",
      connected: findCredential("discord"),
      connectUrl: "/users/auth/discord",
      disconnectUrl: "/users/auth/discord/disconnect",
    },
    {
      name: I18n.t('user_settings.integrations.providers.twitch.name'),
      description: I18n.t('user_settings.integrations.providers.twitch.description'),
      icon: Icons.twitch,
      provider: "twitch",
      connected: findCredential("twitch"),
      connectUrl: "/users/auth/twitch",
      disconnectUrl: "/users/auth/twitch/disconnect",
    },
    {
      name: I18n.t('user_settings.integrations.providers.stripe.name'),
      description: I18n.t('user_settings.integrations.providers.stripe.description'),
      icon: Icons.stripe,
      provider: "stripe_connect",
      connected: findCredential("stripe_connect"),
      connectUrl: "/stripe_connect",
      disconnectUrl: "/users/auth/stripe_connect/disconnect",
    },
    {
      name: I18n.t('user_settings.integrations.providers.mercado_pago.name'),
      description: I18n.t('user_settings.integrations.providers.mercado_pago.description'),
      icon: Icons.stripe,
      provider: "mercado_pago",
      connected: findCredential("mercado_pago"),
      connectUrl: "/users/auth/mercado_pago",
      disconnectUrl: "/users/auth/mercado_pago/disconnect",
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
          <CardTitle>{I18n.t('user_settings.integrations.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {I18n.t('user_settings.integrations.subtitle')}
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
                        {I18n.t('user_settings.integrations.connected_with')}: {credential.uid}
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
                      {I18n.t('user_settings.integrations.buttons.disconnect')}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAuth(integration.connectUrl)}
                    >
                      {I18n.t('user_settings.integrations.buttons.connect')}
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
