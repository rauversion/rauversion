import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { 
  Mail, Copy, CheckCircle2, XCircle, 
  Clock, RefreshCw 
} from 'lucide-react'
import I18n from 'stores/locales'

export default function InvitationsSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const {
    items: invitations,
    setItems: setInvitations,
    loading: fetchLoading,
    lastElementRef,
    resetList
  } = useInfiniteScroll(`/${username}/invitations.json`)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      email: "",
      message: "",
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await post(`/${username}/invitations`, {
        body: JSON.stringify({ invitation: data }),
        responseKind: "json"
      })
      
      if (response.ok) {
        const data = await response.json
        setInvitations((prev) => [data.invitation, ...prev])
        reset()
        toast({
          title: "Success",
          description: I18n.t('user_settings.invitations.messages.success'),
        })
      } else {
        const data = await response.json
        toast({
          title: "Error",
          description: data.error || I18n.t('user_settings.invitations.messages.error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('user_settings.invitations.messages.error'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="text-green-500" />
      case "pending":
        return <Clock className="text-yellow-500" />
      case "not_sent":
        return <RefreshCw className="text-blue-500" />
      default:
        return <XCircle className="text-red-500" />
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{I18n.t('user_settings.invitations.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {I18n.t('user_settings.invitations.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{I18n.t('user_settings.invitations.form.email.label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={I18n.t('user_settings.invitations.form.email.placeholder')}
                {...register("email", { required: I18n.t('user_settings.invitations.form.email.required') })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{I18n.t('user_settings.invitations.form.message.label')}</Label>
              <Input
                id="message"
                placeholder={I18n.t('user_settings.invitations.form.message.placeholder')}
                {...register("message")}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {I18n.t('user_settings.invitations.buttons.sending')}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {I18n.t('user_settings.invitations.buttons.send')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{I18n.t('user_settings.invitations.sent.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {I18n.t('user_settings.invitations.sent.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations && invitations.map((invitation, index) => (
              <div
                key={invitation.id}
                ref={index === invitations.length - 1 ? lastElementRef : null}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-lg border p-2">
                    {getStatusIcon(invitation.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">{invitation.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      {invitation.status === "accepted"
                        ? I18n.t('user_settings.invitations.sent.status.accepted', { date: new Date(invitation.accepted_at).toLocaleDateString() })
                        : invitation.status === "pending"
                        ? I18n.t('user_settings.invitations.sent.status.pending', { date: new Date(invitation.sent_at).toLocaleDateString() })
                        : I18n.t('user_settings.invitations.sent.status.not_sent')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(invitation.email)
                    toast({
                      title: "Copied",
                      description: I18n.t('user_settings.invitations.messages.copy_success'),
                    })
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fetchLoading && (
              <div className="flex justify-center p-4">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
