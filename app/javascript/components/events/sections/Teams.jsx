import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { post, put, get, destroy } from '@rails/request.js'
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
import { Textarea } from "@/components/ui/textarea"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { ImageUploader } from "@/components/ui/image-uploader"

const teamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["host", "manager", "special_guest"]),
})

const formSchema = z.object({
  team_members: z.array(teamMemberSchema)
})

const hostSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  listed_on_page: z.boolean().optional(),
  event_manager: z.boolean().optional(),
  avatar: z.any().optional()
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
  const [hostToDelete, setHostToDelete] = React.useState(null)
  const [hostToEdit, setHostToEdit] = React.useState(null)
  const [isEditLoading, setIsEditLoading] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team_members: []
    }
  })

  const editForm = useForm({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      name: "",
      description: "",
      listed_on_page: false,
      event_manager: false,
      avatar: null
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "team_members"
  })

  const fetchTeamData = async () => {
    try {
      const response = await get(`/events/${slug}.json`)
      const data = await response.json
      setEvent(data.event)
      // setPendingInvites(data.event.pending_invites || [])
      setCurrentTeam(data.event_hosts || [])
      
      // Reset form with current team members
      form.reset({
        team_members: data.event_hosts?.map(member => ({
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

  React.useEffect(() => {
    fetchTeamData()
  }, [slug])

  const onSubmit = async (data) => {
    try {
      const response = await post(`/events/${slug}/event_hosts.json`, {
        body: JSON.stringify({
          event_hosts_attributes: data.team_members
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const data = await response.json
        // setPendingInvites(data.pending_invites)
        // setCurrentTeam(data.team_members)
        fetchTeamData()
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

  const handleDeleteConfirm = async () => {
    if (!hostToDelete) return

    try {
      const response = await destroy(`/events/${slug}/event_hosts/${hostToDelete.id}.json`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setCurrentTeam(team => team.filter(member => member.id !== hostToDelete.id))
        toast({
          title: "Success",
          description: "Team member removed successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Could not remove team member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      toast({
        title: "Error",
        description: "Could not remove team member",
        variant: "destructive",
      })
    } finally {
      setHostToDelete(null)
    }
  }

  const handleEditSubmit = async (data) => {
    setIsEditLoading(true)
    try {
      const formData = new FormData()
      formData.append('event_host[name]', data.name)
      formData.append('event_host[description]', data.description || '')
      formData.append('event_host[listed_on_page]', data.listed_on_page)
      formData.append('event_host[event_manager]', data.event_manager)
      
      if (data.avatar instanceof File) {
        formData.append('event_host[avatar]', data.avatar)
      }

      const response = await put(`/events/${slug}/event_hosts/${hostToEdit.id}.json`, {
        body: formData,
      })

      const responseData = await response.json

      if (response.ok) {
        setCurrentTeam(team => 
          team.map(member => 
            member.id === hostToEdit.id ? { ...member, ...responseData.event_host } : member
          )
        )
        toast({
          title: "Success",
          description: "Team member updated successfully",
        })
        setHostToEdit(null)
      } else {
        // Set form errors if they exist
        if (responseData.errors) {
          Object.keys(responseData.errors).forEach(key => {
            editForm.setError(key, {
              type: 'server',
              message: responseData.errors[key][0]
            })
          })
        }
        
        toast({
          title: "Error",
          description: responseData.message || "Could not update team member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating team member:', error)
      toast({
        title: "Error",
        description: "Could not update team member",
        variant: "destructive",
      })
    } finally {
      setIsEditLoading(false)
    }
  }

  React.useEffect(() => {
    if (hostToEdit) {
      editForm.reset({
        name: hostToEdit.name,
        description: hostToEdit.description || "",
        listed_on_page: hostToEdit.listed_on_page || false,
        event_manager: hostToEdit.event_manager || false,
        avatar: null
      })
    }
  }, [hostToEdit])

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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Team Members</h3>
            <div className="grid gap-4">
              {currentTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    {member.description && (
                      <p className="text-sm text-gray-600 mt-1">{member.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHostToEdit(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHostToDelete(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                              <FormControl>
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
                              </FormControl>
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

      <AlertDialog open={!!hostToDelete} onOpenChange={(open) => !open && setHostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {hostToDelete?.name} from the team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!hostToEdit} onOpenChange={(open) => {
        if (!open) {
          setHostToEdit(null)
          editForm.reset()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image</FormLabel>
                      <FormControl>
                        <ImageUploader
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isEditLoading}
                          defaultPreview={hostToEdit?.avatar_url}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isEditLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={isEditLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="listed_on_page"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Listed on Page</FormLabel>
                        <FormDescription>
                          Show this team member on the event page
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isEditLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="event_manager"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Event Manager</FormLabel>
                        <FormDescription>
                          Allow this team member to manage the event
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isEditLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setHostToEdit(null)
                    editForm.reset()
                  }}
                  disabled={isEditLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditLoading}>
                  {isEditLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
