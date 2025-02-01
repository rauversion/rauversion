import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
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
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, Info } from "lucide-react"

const streamingSchema = z.object({
  stream_type: z.enum(["rtmp", "youtube", "twitch", "custom"]),
  stream_url: z.string().url().optional(),
  stream_key: z.string().optional(),
  custom_embed_code: z.string().optional(),
  is_streaming: z.boolean().default(false),
  chat_enabled: z.boolean().default(true),
  chat_only_members: z.boolean().default(false),
  recording_enabled: z.boolean().default(true),
})

const streamTypes = [
  { value: "rtmp", label: "RTMP Stream" },
  { value: "youtube", label: "YouTube Live" },
  { value: "twitch", label: "Twitch" },
  { value: "custom", label: "Custom Embed" },
]

export default function Streaming() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [activeTab, setActiveTab] = React.useState("settings")

  const form = useForm({
    resolver: zodResolver(streamingSchema),
    defaultValues: async () => {
      const response = await fetch(`/events/${slug}/streaming.json`)
      const data = await response.json()
      setEvent(data.event)
      return {
        stream_type: data.event.stream_type || "rtmp",
        stream_url: data.event.stream_url,
        stream_key: data.event.stream_key,
        custom_embed_code: data.event.custom_embed_code,
        is_streaming: data.event.is_streaming || false,
        chat_enabled: data.event.chat_enabled || true,
        chat_only_members: data.event.chat_only_members || false,
        recording_enabled: data.event.recording_enabled || true,
      }
    }
  })

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}/streaming.json`, {
        body: JSON.stringify({
          event: data
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const { event } = await response.json
        setEvent(event)
        toast({
          title: "Success",
          description: "Streaming settings updated successfully",
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
      console.error('Error updating streaming settings:', error)
      toast({
        title: "Error",
        description: "Could not update streaming settings",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  const streamType = form.watch("stream_type")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">Stream Settings</TabsTrigger>
          <TabsTrigger value="keys">Stream Keys</TabsTrigger>
          <TabsTrigger value="chat">Chat Settings</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Configuration</CardTitle>
                  <CardDescription>
                    Configure your live streaming settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="stream_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stream Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stream type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {streamTypes.map((type) => (
                              <SelectItem 
                                key={type.value} 
                                value={type.value}
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {streamType === "custom" && (
                    <FormField
                      control={form.control}
                      name="custom_embed_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Embed Code</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste your embed code here"
                              className="font-mono"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="is_streaming"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Stream Status</FormLabel>
                          <FormDescription>
                            Enable when you start streaming
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
                    name="recording_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Recording</FormLabel>
                          <FormDescription>
                            Record the stream for later viewing
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

            <TabsContent value="keys">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Keys</CardTitle>
                  <CardDescription>
                    Your stream URL and key for broadcasting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Keep your stream key private. Never share it with anyone.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="stream_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stream URL</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(field.value)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stream_key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stream Key</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                readOnly
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(field.value)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Settings</CardTitle>
                  <CardDescription>
                    Configure the live chat for your stream
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="chat_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Chat</FormLabel>
                          <FormDescription>
                            Allow viewers to chat during the stream
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
                    name="chat_only_members"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Members Only Chat</FormLabel>
                          <FormDescription>
                            Only allow registered members to chat
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

            <Button type="submit">Save Changes</Button>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
