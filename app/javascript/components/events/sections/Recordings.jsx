import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import I18n from 'stores/locales'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { post, put, destroy, FetchRequest } from "@rails/request.js"

const recordingSchema = z.object({
  title: z.string().min(1, I18n.t('events.edit.recordings.form.title.required')),
  description: z.string().optional(),
  type: z.enum(["twitch", "youtube", "iframe"]),
  iframe: z.string().min(1, I18n.t('events.edit.recordings.form.embed.required')),
})

export default function Recordings() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [selectedRecording, setSelectedRecording] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  const {
    items: recordings,
    loading,
    lastElementRef,
    resetList,
    page,
    fetchItems,
  } = useInfiniteScroll(`/events/${slug}/event_recordings.json`)

  const form = useForm({
    resolver: zodResolver(recordingSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "youtube",
      iframe: "",
    },
  })

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      const url = editMode 
        ? `/events/${slug}/event_recordings/${selectedRecording.id}.json`
        : `/events/${slug}/event_recordings.json`
      
      const method = editMode ? 'PUT' : 'POST'

      const request = new FetchRequest(method, url, { body: JSON.stringify({ event_recording: data }) })
      const response = await request.perform()
  
      if (response.ok) {
        const result = await response.json
        if (result.errors) {
          Object.entries(result.errors).forEach(([key, messages]) => {
            form.setError(key, { message: messages.join(", ") })
          })
        } else {
          toast({
            title: "Success",
            description: I18n.t(editMode ? 'events.edit.recordings.messages.update_success' : 'events.edit.recordings.messages.create_success'),
          })
          setOpen(false)
          setEditMode(false)
          setSelectedRecording(null)
          form.reset()
          resetList()
        }
      } else {
        toast({
          title: "Error",
          description: I18n.t(editMode ? 'events.edit.recordings.messages.update_error' : 'events.edit.recordings.messages.create_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} recording:`, error)
      toast({
        title: "Error",
        description: I18n.t('events.edit.recordings.messages.general_error'),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const editRecording = (recording) => {
    setSelectedRecording(recording)
    setEditMode(true)
    form.reset({
      title: recording.title,
      description: recording.description || "",
      type: recording.type,
      iframe: recording.iframe,
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setSelectedRecording(null)
    form.reset()
  }

  const deleteRecording = async (recordingId) => {
    if (!confirm(I18n.t('events.edit.recordings.messages.delete_confirm'))) return

    try {
      const response = await destroy(`/events/${slug}/event_recordings/${recordingId}.json`)

      if (response.ok) {
        setItems(recordings.filter(r => r.id !== recordingId))
        toast({
          title: "Success",
          description: I18n.t('events.edit.recordings.messages.delete_success'),
        })
      }
    } catch (error) {
      console.error('Error deleting recording:', error)
      toast({
        title: "Error",
        description: I18n.t('events.edit.recordings.messages.delete_error'),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{I18n.t('events.edit.recordings.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {I18n.t('events.edit.recordings.description')}
          </p>
        </div>

        <Button onClick={() => {
          setEditMode(false)
          setSelectedRecording(null)
          form.reset()
          setOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          {I18n.t('events.edit.recordings.add_recording')}
        </Button>

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {I18n.t(editMode ? 'events.edit.recordings.edit_recording' : 'events.edit.recordings.add_recording')}
              </DialogTitle>
              <DialogDescription>
                {I18n.t(editMode ? 'events.edit.recordings.dialog.edit_description' : 'events.edit.recordings.dialog.add_description')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.recordings.form.title.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={I18n.t('events.edit.recordings.form.title.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.recordings.form.description.label')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={I18n.t('events.edit.recordings.form.description.placeholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.recordings.form.platform.label')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={I18n.t('events.edit.recordings.form.platform.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="twitch">{I18n.t('events.edit.recordings.form.platform.options.twitch')}</SelectItem>
                          <SelectItem value="youtube">{I18n.t('events.edit.recordings.form.platform.options.youtube')}</SelectItem>
                          <SelectItem value="iframe">{I18n.t('events.edit.recordings.form.platform.options.iframe')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {I18n.t('events.edit.recordings.form.platform.description')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('events.edit.recordings.form.embed.label')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={I18n.t('events.edit.recordings.form.embed.placeholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {I18n.t('events.edit.recordings.form.embed.description')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {I18n.t(editMode ? 'events.edit.recordings.buttons.update' : 'events.edit.recordings.buttons.add')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recordings.map((recording, index) => (
          <div
            key={recording.id}
            ref={index === recordings.length - 1 ? lastElementRef : null}
            className="relative rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div
              className="aspect-video w-full overflow-hidden rounded-t-lg"
              dangerouslySetInnerHTML={{ __html: recording.iframe }}
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{recording.title}</h3>
              {recording.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {recording.description}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editRecording(recording)}
                >
                  {I18n.t('events.edit.recordings.buttons.edit')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRecording(recording.id)}
                >
                  {I18n.t('events.edit.recordings.buttons.delete')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
