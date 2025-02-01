import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, formatDistanceToNow } from "date-fns"
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
import { Switch } from "@/components/ui/switch"
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
  CardFooter,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  MoreVertical,
  Play,
  Trash2,
  Video,
  Eye,
  EyeOff,
  Share2,
  Clock,
  Film
} from "lucide-react"

const recordingSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  visibility: z.enum(["public", "private", "unlisted"]),
  allow_downloads: z.boolean().default(false),
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
  const [recordings, setRecordings] = React.useState([])
  const [selectedRecording, setSelectedRecording] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  const form = useForm({
    resolver: zodResolver(recordingSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "private",
      allow_downloads: false,
    }
  })

  const loadRecordings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/events/${slug}/recordings.json`)
      const data = await response.json()
      setRecordings(data.recordings)
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

  React.useEffect(() => {
    loadRecordings()
  }, [slug])

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}/recordings/${selectedRecording.id}.json`, {
        body: JSON.stringify({
          recording: data
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        loadRecordings()
        setSelectedRecording(null)
        form.reset()
        toast({
          title: "Success",
          description: "Recording updated successfully",
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
      console.error('Error updating recording:', error)
      toast({
        title: "Error",
        description: "Could not update recording",
        variant: "destructive",
      })
    }
  }

  const deleteRecording = async (recordingId) => {
    if (!confirm("Are you sure you want to delete this recording?")) return

    try {
      const response = await fetch(`/events/${slug}/recordings/${recordingId}.json`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadRecordings()
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

  const editRecording = (recording) => {
    setSelectedRecording(recording)
    form.reset({
      title: recording.title,
      description: recording.description,
      visibility: recording.visibility,
      allow_downloads: recording.allow_downloads,
    })
  }

  const cancelEdit = () => {
    setSelectedRecording(null)
    form.reset()
  }

  const copyShareLink = async (recording) => {
    try {
      await navigator.clipboard.writeText(recording.share_url)
      toast({
        title: "Success",
        description: "Share link copied to clipboard",
      })
    } catch (error) {
      console.error('Error copying share link:', error)
      toast({
        title: "Error",
        description: "Could not copy share link",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Recordings</CardTitle>
          <CardDescription>
            Manage recordings from your live streams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recording</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-18 bg-muted rounded overflow-hidden">
                          {recording.thumbnail_url ? (
                            <img
                              src={recording.thumbnail_url}
                              alt={recording.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{recording.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {recording.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {recording.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recording.status === "processing" ? (
                        <div className="space-y-2">
                          <Badge
                            variant="secondary"
                            className={recordingStatuses[recording.status].color}
                          >
                            {recordingStatuses[recording.status].label}
                          </Badge>
                          <Progress value={recording.processing_progress} />
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={recordingStatuses[recording.status].color}
                        >
                          {recordingStatuses[recording.status].label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {recording.visibility === "public" ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        <span className="capitalize">{recording.visibility}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => window.open(recording.play_url, '_blank')}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Play Recording
                          </DropdownMenuItem>
                          {recording.allow_downloads && (
                            <DropdownMenuItem
                              onClick={() => window.open(recording.download_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => copyShareLink(recording)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Copy Share Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => editRecording(recording)}>
                            <Video className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteRecording(recording.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Recording
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {recordings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No recordings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedRecording && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Recording</CardTitle>
            <CardDescription>
              Update recording details and visibility settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visibilityOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
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
                  name="allow_downloads"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Downloads</FormLabel>
                        <FormDescription>
                          Let viewers download this recording
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
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)}>
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
