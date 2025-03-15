import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { put } from '@rails/request.js'
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  AlertTriangle,
  Globe,
  Lock,
  Settings as SettingsIcon,
  Share2,
  Trash2,
  Users
} from "lucide-react"

const settingsSchema = z.object({
  slug: z.string().min(2, {
    message: I18n.t('events.edit.settings.validation.slug_min'),
  }).regex(/^[a-z0-9-]+$/, {
    message: I18n.t('events.edit.settings.validation.slug_format'),
  }),
  visibility: z.enum(["public", "private", "unlisted"]),
  registration_type: z.enum(["open", "invite", "approval"]),
  allow_comments: z.boolean().default(true),
  show_attendees: z.boolean().default(true),
  show_remaining_tickets: z.boolean().default(true),
  social_sharing: z.boolean().default(true),
  require_login: z.boolean().default(false),
})

const visibilityOptions = [
  { value: "public", label: I18n.t('events.edit.settings.privacy.visibility.options.public'), icon: Globe },
  { value: "private", label: I18n.t('events.edit.settings.privacy.visibility.options.private'), icon: Lock },
  { value: "unlisted", label: I18n.t('events.edit.settings.privacy.visibility.options.unlisted'), icon: Share2 },
]

const registrationOptions = [
  { 
    value: "open", 
    label: I18n.t('events.edit.settings.privacy.registration.options.open.label'), 
    description: I18n.t('events.edit.settings.privacy.registration.options.open.description') 
  },
  { 
    value: "invite", 
    label: I18n.t('events.edit.settings.privacy.registration.options.invite.label'), 
    description: I18n.t('events.edit.settings.privacy.registration.options.invite.description') 
  },
  { 
    value: "approval", 
    label: I18n.t('events.edit.settings.privacy.registration.options.approval.label'), 
    description: I18n.t('events.edit.settings.privacy.registration.options.approval.description') 
  },
]

export default function Settings() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: async () => {
      const response = await fetch(`/events/${slug}/edit.json`)
      const data = await response.json()
      setEvent(data)
      setLoading(false)
      return {
        slug: data.slug,
        visibility: data.visibility || "public",
        registration_type: data.registration_type || "open",
        allow_comments: data.allow_comments ?? true,
        show_attendees: data.show_attendees ?? true,
        show_remaining_tickets: data.show_remaining_tickets ?? true,
        social_sharing: data.social_sharing ?? true,
        require_login: data.require_login ?? false,
      }
    }
  })

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}.json`, {
        body: JSON.stringify({
          event: data
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const { event } = await response.json
        setEvent(event)
        
        if (event.slug !== slug) {
          navigate(`/events/${event.slug}/edit/settings`, { replace: true })
        }

        toast({
          title: "Success",
          description: I18n.t('events.edit.settings.messages.success'),
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
      console.error('Error updating settings:', error)
      toast({
        title: "Error",
        description: I18n.t('events.edit.settings.messages.error'),
        variant: "destructive",
      })
    }
  }

  const deleteEvent = async () => {
    try {
      const response = await fetch(`/events/${slug}.json`, {
        method: 'DELETE'
      })

      if (response.ok) {
        navigate('/events', { replace: true })
        toast({
          title: "Success",
          description: I18n.t('events.edit.settings.messages.delete_success'),
        })
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error",
        description: I18n.t('events.edit.settings.messages.delete_error'),
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>{I18n.t('events.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{I18n.t('events.edit.settings.tabs.general')}</TabsTrigger>
          <TabsTrigger value="privacy">{I18n.t('events.edit.settings.tabs.privacy')}</TabsTrigger>
          <TabsTrigger value="danger">{I18n.t('events.edit.settings.tabs.danger')}</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>{I18n.t('events.edit.settings.general.title')}</CardTitle>
                  <CardDescription>
                    {I18n.t('events.edit.settings.general.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('events.edit.settings.general.url.label')}</FormLabel>
                        <FormDescription>
                          {I18n.t('events.edit.settings.general.url.description')}
                        </FormDescription>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {window.location.origin}/events/
                          </div>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_remaining_tickets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{I18n.t('events.edit.settings.general.remaining_tickets.label')}</FormLabel>
                          <FormDescription>
                            {I18n.t('events.edit.settings.general.remaining_tickets.description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_attendees"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{I18n.t('events.edit.settings.general.attendee_list.label')}</FormLabel>
                          <FormDescription>
                            {I18n.t('events.edit.settings.general.attendee_list.description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allow_comments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{I18n.t('events.edit.settings.general.comments.label')}</FormLabel>
                          <FormDescription>
                            {I18n.t('events.edit.settings.general.comments.description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_sharing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{I18n.t('events.edit.settings.general.social_sharing.label')}</FormLabel>
                          <FormDescription>
                            {I18n.t('events.edit.settings.general.social_sharing.description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>{I18n.t('events.edit.settings.privacy.title')}</CardTitle>
                  <CardDescription>
                    {I18n.t('events.edit.settings.privacy.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('events.edit.settings.privacy.visibility.label')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={I18n.t('events.edit.settings.privacy.visibility.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {visibilityOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registration_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('events.edit.settings.privacy.registration.label')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={I18n.t('events.edit.settings.privacy.registration.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {registrationOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex flex-col gap-1">
                                  <div>{option.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="require_login"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{I18n.t('events.edit.settings.privacy.require_login.label')}</FormLabel>
                          <FormDescription>
                            {I18n.t('events.edit.settings.privacy.require_login.description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="danger">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">{I18n.t('events.edit.settings.danger.title')}</CardTitle>
                  <CardDescription>
                    {I18n.t('events.edit.settings.danger.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{I18n.t('events.edit.settings.danger.warning.title')}</AlertTitle>
                    <AlertDescription>
                      {I18n.t('events.edit.settings.danger.warning.description')}
                    </AlertDescription>
                  </Alert>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {I18n.t('events.edit.settings.danger.delete.button')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{I18n.t('events.edit.settings.danger.delete.confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {I18n.t('events.edit.settings.danger.delete.confirm_description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{I18n.t('events.edit.settings.danger.delete.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteEvent}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {I18n.t('events.edit.settings.danger.delete.button')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>

            <Button type="submit">{I18n.t('events.edit.settings.save')}</Button>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
