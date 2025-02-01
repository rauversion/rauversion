import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { put } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, Trash2, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const teamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["host", "manager", "special_guest"]),
})

const formSchema = z.object({
  team_members: z.array(teamMemberSchema)
})

const roleOptions = [
  { value: "host", label: "Host" },
  { value: "manager", label: "Manager" },
  { value: "special_guest", label: "Special Guest" },
]

export default function Teams() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [pendingInvites, setPendingInvites] = React.useState([])
  const [currentTeam, setCurrentTeam] = React.useState([])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team_members: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "team_members"
  })

  React.useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`/events/${slug}/team.json`)
        const data = await response.json()
        setEvent(data.event)
        setPendingInvites(data.event.pending_invites || [])
        setCurrentTeam(data.event.team_members || [])
        
        // Reset form with current team members
        form.reset({
          team_members: data.event.team_members?.map(member => ({
            email: member.email,
            role: member.role
          })) || []
        })
      } catch (error) {
        console.error('Error fetching team data:', error)
        toast({
          title: "Error",
          description: "Could not load team data",
          variant: "destructive",
        })
      }
    }

    fetchTeamData()
  }, [slug])

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}/team.json`, {
        body: JSON.stringify({
          event: {
            team_members_attributes: data.team_members
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const data = await response.json
        setPendingInvites(data.pending_invites)
        setCurrentTeam(data.team_members)
        form.reset({ team_members: [] })
        toast({
          title: "Success",
          description: "Invitations sent successfully",
        })
      } else {
        const { errors } = await response.json
        Object.keys(errors).forEach((key) => {
          form.setError(key, {
            type: 'manual',
            message: errors[key][0]
          })
        })
      }
    } catch (error) {
      console.error('Error updating team:', error)
      toast({
        title: "Error",
        description: "Could not send invitations",
        variant: "destructive",
      })
    }
  }

  const addTeamMember = () => {
    append({
      email: "",
      role: "host"
    })
  }

  const removeMember = async (memberId) => {
    try {
      const response = await put(`/events/${slug}/remove_team_member.json`, {
        body: JSON.stringify({
          member_id: memberId
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const data = await response.json
        setCurrentTeam(data.team_members)
        toast({
          title: "Success",
          description: "Team member removed successfully",
        })
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      toast({
        title: "Error",
        description: "Could not remove team member",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Team</CardTitle>
          <CardDescription>
            People who are currently part of your event team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeam.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  <TableCell>{member.status}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Invitations that have been sent but not yet accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell className="capitalize">{invite.role}</TableCell>
                  <TableCell>{invite.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add Team Members</CardTitle>
              <CardDescription>
                Invite new people to help manage your event
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeamMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`team_members.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="email@example.com"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`team_members.${index}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleOptions.map((role) => (
                                    <SelectItem 
                                      key={role.value} 
                                      value={role.value}
                                    >
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {fields.length > 0 && (
                <Button type="submit">Send Invitations</Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
