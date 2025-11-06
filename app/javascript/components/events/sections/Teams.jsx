import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { post, put, get, destroy } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import I18n from 'stores/locales'
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
  name: z.string().min(1, I18n.t('events.edit.teams.edit_member.name.required')),
  description: z.string().optional(),
  listed_on_page: z.boolean().optional(),
  event_manager: z.boolean().optional(),
  avatar: z.any().optional()
})

const roleOptions = [
  { value: "host", label: I18n.t('events.edit.teams.roles.host') },
  { value: "manager", label: I18n.t('events.edit.teams.roles.manager') },
  { value: "special_guest", label: I18n.t('events.edit.teams.roles.special_guest') },
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
      const response = await get(`/events/${slug}/edit.json`)
      const data = await response.json
      setEvent(data.event)
      setCurrentTeam(data.event_hosts || [])
      setPendingInvites(data.pending_invites || [])
      
      form.reset({
        team_members: []
      })
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast({
        title: I18n.t("events.edit.teams.messages.error_title"),
        description: I18n.t('events.edit.teams.messages.load_error'),
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
        fetchTeamData()
        form.reset({ team_members: [] })
        toast({
          title: I18n.t("events.edit.teams.messages.success_title"),
          description: I18n.t('events.edit.teams.messages.invites_success'),
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
        title: I18n.t("events.edit.teams.messages.error_title"),
        description: I18n.t('events.edit.teams.messages.invites_error'),
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
      const response = await destroy(`/events/${slug}/event_hosts/${hostToDelete.id}.json`)

      if (response.ok) {
        setCurrentTeam(team => team.filter(member => member.id !== hostToDelete.id))
        toast({
          title: I18n.t("events.edit.teams.messages.success_title"),
          description: I18n.t('events.edit.teams.messages.remove_success'),
        })
      } else {
        const data = await response.json()
        toast({
          title: I18n.t("events.edit.teams.messages.error_title"),
          description: data.message || I18n.t('events.edit.teams.messages.remove_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      toast({
        title: I18n.t("events.edit.teams.messages.error_title"),
        description: I18n.t('events.edit.teams.messages.remove_error'),
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
          title: I18n.t("events.edit.teams.messages.success_title"),
          description: I18n.t('events.edit.teams.messages.update_success'),
        })
        setHostToEdit(null)
      } else {
        if (responseData.errors) {
          Object.keys(responseData.errors).forEach(key => {
            editForm.setError(key, {
              type: 'server',
              message: responseData.errors[key][0]
            })
          })
        }
        
        toast({
          title: I18n.t("events.edit.teams.messages.error_title"),
          description: responseData.message || I18n.t('events.edit.teams.messages.update_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating team member:', error)
      toast({
        title: I18n.t("events.edit.teams.messages.error_title"),
        description: I18n.t('events.edit.teams.messages.update_error'),
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
          <CardTitle>{I18n.t('events.edit.teams.current_team.title')}</CardTitle>
          <CardDescription>
            {I18n.t('events.edit.teams.current_team.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{I18n.t('events.edit.teams.current_team.members')}</h3>
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
          <CardTitle>{I18n.t('events.edit.teams.pending.title')}</CardTitle>
          <CardDescription>
            {I18n.t('events.edit.teams.pending.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{I18n.t('events.edit.teams.pending.table.email')}</TableHead>
                <TableHead>{I18n.t('events.edit.teams.pending.table.role')}</TableHead>
                <TableHead>{I18n.t('events.edit.teams.pending.table.sent_at')}</TableHead>
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
              <CardTitle>{I18n.t('events.edit.teams.add_members.title')}</CardTitle>
              <CardDescription>
                {I18n.t('events.edit.teams.add_members.description')}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeamMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {I18n.t('events.edit.teams.add_members.add_person')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{I18n.t('events.edit.teams.pending.table.email')}</TableHead>
                    <TableHead>{I18n.t('events.edit.teams.pending.table.role')}</TableHead>
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
                                  placeholder={I18n.t('events.edit.teams.add_members.email_placeholder')}
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
                                      <SelectValue placeholder={I18n.t('events.edit.teams.add_members.role_placeholder')} />
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
                <Button type="submit">{I18n.t('events.edit.teams.add_members.send_invitations')}</Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={!!hostToDelete} onOpenChange={(open) => !open && setHostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{I18n.t('events.edit.teams.delete_member.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {I18n.t('events.edit.teams.delete_member.description', { name: hostToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{I18n.t('events.edit.teams.delete_member.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {I18n.t('events.edit.teams.delete_member.continue')}
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
            <DialogTitle>{I18n.t('events.edit.teams.edit_member.title')}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.profile_image')}</FormLabel>
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
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.name.label')}</FormLabel>
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
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.description')}</FormLabel>
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
                        <FormLabel>{I18n.t('events.edit.teams.edit_member.listed.label')}</FormLabel>
                        <FormDescription>
                          {I18n.t('events.edit.teams.edit_member.listed.description')}
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
                        <FormLabel>{I18n.t('events.edit.teams.edit_member.manager.label')}</FormLabel>
                        <FormDescription>
                          {I18n.t('events.edit.teams.edit_member.manager.description')}
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
                  {I18n.t('events.edit.teams.edit_member.cancel')}
                </Button>
                <Button type="submit" disabled={isEditLoading}>
                  {isEditLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {I18n.t('events.edit.teams.edit_member.saving')}
                    </>
                  ) : (
                    I18n.t('events.edit.teams.edit_member.save')
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
