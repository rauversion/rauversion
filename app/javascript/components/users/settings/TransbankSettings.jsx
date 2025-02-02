import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useForm, Controller } from "react-hook-form"
import { get, post, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function TransbankSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)
  const [verificationStatus, setVerificationStatus] = React.useState('unverified')

  React.useEffect(() => {
    const fetchUser = async () => {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        setUser(data.user)
        if (data.transbank_status) {
          setVerificationStatus(data.transbank_status)
        }
      }
    }
    fetchUser()
  }, [username])

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      commerce_code: user?.transbank_settings?.commerce_code || "",
      api_key: user?.transbank_settings?.api_key || "",
      test_mode: user?.transbank_settings?.test_mode || true,
      automatic_transfer: user?.transbank_settings?.automatic_transfer || false,
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/transbank`, {
        body: JSON.stringify({ user: { transbank_settings_attributes: data } }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your Transbank settings have been updated.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your Transbank settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your Transbank settings.",
        variant: "destructive",
      })
    }
  }

  const verifyCredentials = async () => {
    try {
      const response = await post(`/${username}/settings/transbank/verify`)
      if (response.ok) {
        const data = await response.json()
        setVerificationStatus(data.status)
        toast({
          title: data.status === 'verified' ? "Success" : "Error",
          description: data.message,
          variant: data.status === 'verified' ? "default" : "destructive",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Could not verify Transbank credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not verify Transbank credentials",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Transbank Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your Transbank payment settings.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted">
            <div className="p-2 bg-background rounded-full">
              {verificationStatus === 'verified' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : verificationStatus === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">Integration Status</p>
              <p className="text-sm text-muted-foreground capitalize">
                {verificationStatus}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commerce_code">Commerce Code</Label>
              <Input
                id="commerce_code"
                {...register("commerce_code")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                {...register("api_key")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use Transbank test environment
                </p>
              </div>
              <Controller
                name="test_mode"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Transfer</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically transfer funds to your bank account
                </p>
              </div>
              <Controller
                name="automatic_transfer"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={verifyCredentials}
              >
                Verify Credentials
              </Button>
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
