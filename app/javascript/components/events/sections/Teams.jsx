import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { post, put, get, destroy } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
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
  access_role: z.enum(["host", "admin", "admission", "grant_admission"]),
})

const formSchema = z.object({
  team_members: z.array(teamMemberSchema)
})

const hostSchema = z.object({
  name: z.string().min(1, I18n.t('events.edit.teams.edit_member.name.required')),
  description: z.string().optional(),
  listed_on_page: z.boolean().optional(),
  access_role: z.enum(["host", "admin", "admission", "grant_admission"]).default("host"),
  avatar: z.any().optional()
})

const accessRoleOptions = [
  { value: "host", label: I18n.t('events.edit.teams.roles.host') },
  { value: "admin", label: I18n.t('events.edit.teams.access_roles.admin', { defaultValue: 'Admin' }) },
  { value: "admission", label: I18n.t('events.edit.teams.access_roles.admission', { defaultValue: 'Admisión' }) },
  { value: "grant_admission", label: I18n.t('events.edit.teams.access_roles.grant_admission', { defaultValue: 'Grant Admission' }) },
]

export default function Teams() {
  const { slug } = useParams()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [pendingInvites, setPendingInvites] = React.useState([])
  const [currentTeam, setCurrentTeam] = React.useState([])
  const [hostToDelete, setHostToDelete] = React.useState(null)
  const [hostToEdit, setHostToEdit] = React.useState(null)
  const [isEditLoading, setIsEditLoading] = React.useState(false)
  const [previewImageUrl, setPreviewImageUrl] = React.useState(null)
  const [showStandaloneDialog, setShowStandaloneDialog] = React.useState(false)
  const [isStandaloneLoading, setIsStandaloneLoading] = React.useState(false)
  const [standalonePreviewUrl, setStandalonePreviewUrl] = React.useState(null)

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
      access_role: "host",
      avatar: null
    }
  })

  const standaloneForm = useForm({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      name: "",
      description: "",
      listed_on_page: false,
      access_role: "host",
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
      access_role: "host"
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
        const data = await response.json
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

  const handleImageUpload = async (blobId, cropData, serviceUrl) => {
    // Store the blob ID for submission
    editForm.setValue('avatar', blobId)
    // Store the service URL for immediate preview
    setPreviewImageUrl(serviceUrl)
  }

  const handleEditSubmit = async (data) => {
    setIsEditLoading(true)
    try {
      const formData = new FormData()
      formData.append('event_host[name]', data.name)
      formData.append('event_host[description]', data.description || '')
      formData.append('event_host[listed_on_page]', data.listed_on_page)
      formData.append('event_host[access_role]', data.access_role)

      if (data.avatar) {
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

  const handleStandaloneImageUpload = async (blobId, cropData, serviceUrl) => {
    standaloneForm.setValue('avatar', blobId)
    setStandalonePreviewUrl(serviceUrl)
  }

  const handleStandaloneSubmit = async (data) => {
    setIsStandaloneLoading(true)
    try {
      const formData = new FormData()
      formData.append('event_host[name]', data.name)
      formData.append('event_host[description]', data.description || '')
      formData.append('event_host[listed_on_page]', data.listed_on_page)
      formData.append('event_host[access_role]', data.access_role)

      if (data.avatar) {
        formData.append('event_host[avatar]', data.avatar)
      }

      const response = await post(`/events/${slug}/event_hosts.json`, {
        body: formData,
      })

      const responseData = await response.json

      if (response.ok) {
        fetchTeamData()
        toast({
          title: I18n.t("events.edit.teams.messages.success_title"),
          description: I18n.t('events.edit.teams.messages.update_success'),
        })
        setShowStandaloneDialog(false)
        standaloneForm.reset()
        setStandalonePreviewUrl(null)
      } else {
        if (responseData.errors) {
          Object.keys(responseData.errors).forEach(key => {
            standaloneForm.setError(key, {
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
      console.error('Error creating standalone host:', error)
      toast({
        title: I18n.t("events.edit.teams.messages.error_title"),
        description: I18n.t('events.edit.teams.messages.update_error'),
        variant: "destructive",
      })
    } finally {
      setIsStandaloneLoading(false)
    }
  }

  React.useEffect(() => {
    if (hostToEdit) {
      editForm.reset({
        name: hostToEdit.name,
        description: hostToEdit.description || "",
        listed_on_page: hostToEdit.listed_on_page || false,
        access_role: hostToEdit.access_role || (hostToEdit.event_manager ? "admin" : "host"),
        avatar: null
      })
      // Reset preview to show existing avatar
      setPreviewImageUrl(null)
    }
  }, [hostToEdit])

  const getRoleLabel = React.useCallback((role) => (
    accessRoleOptions.find((option) => option.value === role)?.label ||
    I18n.t('events.edit.teams.roles.host')
  ), [])

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
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar_url?.small} alt={member.name} />
                      <AvatarFallback>{member.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="break-words font-medium">{member.name}</p>
                      {member.description && (
                        <p className="mt-1 break-words text-sm text-muted-foreground">{member.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {member.listed_on_page && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {I18n.t('events.edit.teams.edit_member.listed.label')}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          {getRoleLabel(member.access_role)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => setHostToEdit(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 sm:flex-none"
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
          {isMobile ? (
            pendingInvites.length > 0 ? (
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border p-4">
                    <div className="break-all font-medium">{invite.email}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        {getRoleLabel(invite.role)}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      {invite.created_at}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {I18n.t('events.edit.teams.pending.empty', { defaultValue: 'No hay invitaciones pendientes.' })}
              </p>
            )
          ) : (
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
                    <TableCell className="capitalize">{getRoleLabel(invite.role)}</TableCell>
                    <TableCell>{invite.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle>{I18n.t('events.edit.teams.add_members.title')}</CardTitle>
              <CardDescription>
                {I18n.t('events.edit.teams.add_members.description')}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setShowStandaloneDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {I18n.t('events.edit.teams.add_standalone_host.button')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={addTeamMember}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {I18n.t('events.edit.teams.add_members.add_person')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {isMobile ? (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-4 rounded-lg border p-4">
                      <FormField
                        control={form.control}
                        name={`team_members.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{I18n.t('events.edit.teams.pending.table.email')}</FormLabel>
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

                      <FormField
                        control={form.control}
                        name={`team_members.${index}.access_role`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{I18n.t('events.edit.teams.pending.table.role')}</FormLabel>
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
                                {accessRoleOptions.map((role) => (
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

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-center"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {I18n.t('events.edit.teams.remove_member', { defaultValue: 'Eliminar' })}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
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
                            name={`team_members.${index}.access_role`}
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
                                      {accessRoleOptions.map((role) => (
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
              )}

              {fields.length > 0 && (
                <Button type="submit" className="w-full sm:w-auto">
                  {I18n.t('events.edit.teams.add_members.send_invitations')}
                </Button>
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
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
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
                          onUploadComplete={handleImageUpload}
                          imageUrl={previewImageUrl || hostToEdit?.avatar_url?.medium}
                          aspectRatio={1}
                          maxSize={10}
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
                    <FormItem className="flex flex-col gap-4 rounded-lg border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
                  name="access_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.access_role.label', { defaultValue: 'Nivel de acceso' })}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEditLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={I18n.t('events.edit.teams.edit_member.access_role.placeholder', { defaultValue: 'Selecciona un nivel de acceso' })} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accessRoleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {I18n.t('events.edit.teams.edit_member.access_role.description', {
                          defaultValue: 'Admin puede ver reportes y gestionar asistentes. Admission puede usar admisión y ver asistentes. Grant Admission además puede enviar invitaciones.',
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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

      <Dialog open={showStandaloneDialog} onOpenChange={(open) => {
        if (!open) {
          setShowStandaloneDialog(false)
          standaloneForm.reset()
          setStandalonePreviewUrl(null)
        }
      }}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{I18n.t('events.edit.teams.add_standalone_host.title')}</DialogTitle>
          </DialogHeader>
          <Form {...standaloneForm}>
            <form onSubmit={standaloneForm.handleSubmit(handleStandaloneSubmit)} className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={standaloneForm.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.profile_image')}</FormLabel>
                      <FormControl>
                        <ImageUploader
                          onUploadComplete={handleStandaloneImageUpload}
                          imageUrl={standalonePreviewUrl}
                          aspectRatio={1}
                          maxSize={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={standaloneForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.name.label')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={I18n.t('events.edit.teams.add_standalone_host.name_placeholder')}
                          disabled={isStandaloneLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={standaloneForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={I18n.t('events.edit.teams.add_standalone_host.description_placeholder')}
                          disabled={isStandaloneLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={standaloneForm.control}
                  name="listed_on_page"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4 rounded-lg border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
                          disabled={isStandaloneLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={standaloneForm.control}
                  name="access_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.teams.edit_member.access_role.label', { defaultValue: 'Nivel de acceso' })}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isStandaloneLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={I18n.t('events.edit.teams.edit_member.access_role.placeholder', { defaultValue: 'Selecciona un nivel de acceso' })} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accessRoleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {I18n.t('events.edit.teams.edit_member.access_role.description', {
                          defaultValue: 'Admin puede ver reportes y gestionar asistentes. Admission puede usar admisión y ver asistentes. Grant Admission además puede enviar invitaciones.',
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStandaloneDialog(false)
                    standaloneForm.reset()
                    setStandalonePreviewUrl(null)
                  }}
                  disabled={isStandaloneLoading}
                >
                  {I18n.t('events.edit.teams.add_standalone_host.cancel')}
                </Button>
                <Button type="submit" disabled={isStandaloneLoading}>
                  {isStandaloneLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {I18n.t('events.edit.teams.add_standalone_host.creating')}
                    </>
                  ) : (
                    I18n.t('events.edit.teams.add_standalone_host.create')
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
