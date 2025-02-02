import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useForm, Controller } from "react-hook-form"
import { get, post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { 
  Youtube, Music, Twitch, RefreshCw, 
  AlertTriangle, CheckCircle2 
} from 'lucide-react'

export default function IntegrationsSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)
  const [integrationStatus, setIntegrationStatus] = React.useState({
    youtube: 'disconnected',
    soundcloud: 'disconnected',
    twitch: 'disconnected'
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        setUser(data.user)
        if (data.integrations) {
          setIntegrationStatus(data.integrations)
        }
      }
    }
    fetchUser()
  }, [username])

  const { control } = useForm({
    defaultValues: {
      youtube_sync: false,
      soundcloud_sync: false,
      twitch_sync: false,
    },
  })

  const handleConnect = async (service) => {
    try {
      const response = await post(`/${username}/settings/integrations/connect`, {
        body: JSON.stringify({ service }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.auth_url
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Could not connect to ${service}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not connect to ${service}`,
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async (service) => {
    try {
      const response = await post(`/${username}/settings/integrations/disconnect`, {
        body: JSON.stringify({ service }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setIntegrationStatus(prev => ({
          ...prev,
          [service]: 'disconnected'
        }))
        toast({
          title: "Success",
          description: `Disconnected from ${service}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Could not disconnect from ${service}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not disconnect from ${service}`,
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  const integrations = [
    {
      name: 'youtube',
      label: 'YouTube',
      icon: Youtube,
      description: 'Sync your videos and live streams'
    },
    {
      name: 'soundcloud',
      label: 'SoundCloud',
      icon: Music,
      description: 'Import your tracks and playlists'
    },
    {
      name: 'twitch',
      label: 'Twitch',
      icon: Twitch,
      description: 'Connect your live streams'
    }
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect and manage your external service integrations.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {integrations.map(({ name, label, icon: Icon, description }) => (
            <div key={name} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    {integrationStatus[name] === 'connected' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : integrationStatus[name] === 'error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className="text-sm capitalize">{integrationStatus[name]}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {integrationStatus[name] === 'connected' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDisconnect(name)}
                    >
                      Disconnect
                    </Button>
                    <div className="flex items-center justify-between space-x-2">
                      <Label className="text-sm">Auto-sync</Label>
                      <Controller
                        name={`${name}_sync`}
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(name)}
                  >
                    Connect
                  </Button>
                )}
                {integrationStatus[name] === 'connected' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(name)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
