import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { 
  Mail, Copy, CheckCircle2, XCircle, 
  Clock, RefreshCw 
} from 'lucide-react'

export default function InvitationsSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)
  const [invitations, setInvitations] = React.useState([])
  const [loading, setLoading] = React.useState(false)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      email: "",
      message: "",
    },
  })

  React.useEffect(() => {
    fetchInvitations()
  }, [username])

  const fetchInvitations = async () => {
    try {
      const response = await get(`/${username}/settings/invitations`)
      if (response.ok) {
        const data = await response.json
        setInvitations(data.invitations)
      } else {
        toast({
          title: "Error",
          description: "Could not fetch invitations",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch invitations",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await post(`/${username}/settings/invitations`, {
        body: JSON.stringify({ invitation: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation sent successfully.",
        })
        reset()
        fetchInvitations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Could not send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not send invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async (code) => {
    const link = `${window.location.origin}/invite/${code}`
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Success",
        description: "Invite link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy link",
        variant: "destructive",
      })
    }
  }

  const resendInvitation = async (id) => {
    try {
      const response = await post(`/${username}/settings/invitations/${id}/resend`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation resent successfully",
        })
        fetchInvitations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Could not resend invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not resend invitation",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Invite others to join your network.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: true })}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Input
                id="message"
                {...register("message")}
                placeholder="Add a personal message to your invitation"
              />
            </div>

            <Button type="submit" disabled={loading}>
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Invitations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track and manage your sent invitations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No invitations sent yet
              </p>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{invitation.email}</p>
                      {getStatusIcon(invitation.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInvitation(invitation.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
