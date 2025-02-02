import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
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
import { post, put, destroy } from "@rails/request.js"

const recordingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["twitch", "youtube", "iframe"]),
  iframe: z.string().min(1, "Iframe code is required"),
})

const visibilityOptions = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
]

const recordingStatuses = {
  processing: { label: "Processing", color: "bg-yellow-500" },
  ready: { label: "Ready", color: "bg-green-500" },
  failed: { label: "Failed", color: "bg-red-500" },
}

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
      
      const method = editMode ? 'put' : 'post'
      const response = await window.Requests[method](url, {
        body: JSON.stringify({ event_recording: data }),
        responseKind: 'json',
      })

      if (response.ok) {
        const result = await response.json
        if (result.errors) {
          Object.entries(result.errors).forEach(([key, messages]) => {
            form.setError(key, { message: messages.join(", ") })
          })
        } else {
          toast({
            title: "Success",
            description: `Recording ${editMode ? 'updated' : 'created'} successfully`,
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
          description: `Failed to ${editMode ? 'update' : 'create'} recording`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} recording:`, error)
      toast({
        title: "Error",
        description: "Something went wrong",
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

  const loadRecordings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/events/${slug}/event_recordings.json`)
      const data = await response.json()
      resetList(data.recordings)
    } catch (error) {
      console.error('Error loading recordings:', error)
      toast({
        title: "Error",
        description: "Could not load recordings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

 /* React.useEffect(() => {
    loadRecordings()
  }, [slug])*/

  const deleteRecording = async (recordingId) => {
    if (!confirm("Are you sure you want to delete this recording?")) return

    try {
      const response = await destroy(`/events/${slug}/event_recordings/${recordingId}.json`)

      if (response.ok) {
        resetList()
        toast({
          title: "Success",
          description: "Recording deleted successfully",
        })
      }
    } catch (error) {
      console.error('Error deleting recording:', error)
      toast({
        title: "Error",
        description: "Could not delete recording",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Event Recordings</h2>
          <p className="text-sm text-muted-foreground">
            Add recordings from Twitch, YouTube, or other platforms
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Recording
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit' : 'Add'} Recording</DialogTitle>
              <DialogDescription>
                {editMode 
                  ? 'Update the recording details'
                  : 'Add a recording to highlight it on the event page'
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Recording title" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Recording description"
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
                      <FormLabel>Platform</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="twitch">Twitch</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="iframe">Other (iframe)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the platform where your recording is hosted
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
                      <FormLabel>Embed Code</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the embed code or URL here"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        For YouTube/Twitch: paste the embed code. For other platforms,
                        use the full iframe HTML code.
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
                    {editMode ? 'Update' : 'Add'} Recording
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
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRecording(recording.id)}
                >
                  Delete
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
