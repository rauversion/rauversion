import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { put, get } from '@rails/request.js'
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { CheckIcon, ArrowUpRight, Loader2 } from "lucide-react"

const streamingServices = [
  {
    name: "twitch",
    active: true,
    description: "Twitch is a streaming service"
  },
  {
    name: "mux",
    active: true,
    description: "Mux is a streaming service"
  },
  {
    name: "whereby",
    active: true,
    description: "Whereby is a streaming service"
  },
  {
    name: "stream_yard",
    active: true,
    description: "Live Streaming to 15 services at once, including youtube, twitch, zoom etc..."
  },
  {
    name: "zoom",
    active: true,
    description: "Zoom is a streaming service"
  },
  {
    name: "jitsi",
    active: false,
    description: "Live Streaming on jitsi open source platform"
  },
  {
    name: "restream",
    active: true,
    description: "Live Streaming to 15 services at once, including youtube, twitch, zoom etc..."
  }
]

function StreamingServiceDialog({ fetchEvent, service, isOpen, onOpenChange }) {
  const { slug } = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [fields, setFields] = React.useState(null)

  const form = useForm({
    defaultValues: async () => {
      try {
        const response = await get(`/events/${slug}/event_streaming_services/new?service=${service.name}`, {
          responseKind: 'json'
        })
        const data = await response.json
        setFields(data)
        setLoading(false)
        return data.default_values || {}
      } catch (error) {
        console.error('Error loading form:', error)
        toast({
          title: "Error",
          description: "Could not load streaming service form",
          variant: "destructive",
        })
        setLoading(false)
        return {}
      }
    }
  })

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}/event_streaming_services/${service.name}`, {
        body: JSON.stringify({
          streaming_service: data
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Streaming service configured successfully",
        })
        onOpenChange(false)
        fetchEvent()
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
      console.error('Error configuring streaming service:', error)
      toast({
        title: "Error",
        description: "Could not configure streaming service",
        variant: "destructive",
      })
    }
  }

  const renderFormField = (field) => {
    switch (field.type) {
      case 'text':
      case 'url':
      case 'email':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormControl>
                  <Input type={field.type} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'textarea':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormControl>
                  <Textarea {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'datetime':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormControl>
                  <Input type="datetime-local" {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'select':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormControl>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...formField}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {service.name}</DialogTitle>
          <DialogDescription>
            Set up your {service.name} streaming integration
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {fields?.fields?.map(renderFormField)}
              <Button type="submit">Save Configuration</Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

const streamingSchema = z.object({
  streaming_service: z.object({
    name: z.string(),
  }),
})

export default function Streaming() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [selectedService, setSelectedService] = React.useState(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const fetchEvent = async () => {
    const response = await fetch(`/events/${slug}.json`)
    const data = await response.json()
    setEvent(data)
  }

  React.useEffect(() => {
    fetchEvent()
  }, [slug])

  const handleServiceClick = (service) => {
    if (service.active) {
      setSelectedService(service)
      setDialogOpen(true)
    }
  }

  console.log(event?.streaming_service?.name, streamingServices)

  return (
    <div className="m-4">
      <div className="my-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Streaming services
          </h2>

          <p className="my-3 text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
            Go live with a remote event via one of the following video streaming services
          </p>

          {event?.streaming_service?.streaming_type && (
            <Button 
              variant="default" 
              size="sm"
              asChild
            >
              <a href={`/events/${slug}/livestream`}>
                Go to streaming event page
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-800 border dark:border-gray-800 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-900 shadow sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0">
        {streamingServices.map((service) => (
          <div 
            key={service.name}
            className={`relative group bg-default p-6 ${
              service.active ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
            } focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500`}
            onClick={() => handleServiceClick(service)}
          >
            <div>
              {event?.streaming_service?.name === service.name && (
                <span className="rounded-lg inline-flex p-3 bg-green-100 text-green-700 ring-4 ring-white">
                  <CheckIcon className="w-6 h-6" />
                </span>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium">
                {service.active ? (
                  <span>{service.name}</span>
                ) : (
                  <div className="flex space-x-2">
                    <span>{service.name}</span>
                    <Badge variant="secondary">SOON</Badge>
                  </div>
                )}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {service.description}
              </p>
            </div>

            {service.active && (
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <ArrowUpRight className="h-6 w-6" />
              </span>
            )}
          </div>
        ))}
      </div>

      {selectedService && (
        <StreamingServiceDialog 
          fetchEvent={fetchEvent}
          service={selectedService}
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  )
}
