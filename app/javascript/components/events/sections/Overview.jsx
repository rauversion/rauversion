import React, { useContext } from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import I18n from 'stores/locales'
import { EventEditContext } from "../EventEdit"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parse } from "date-fns"
import { put } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { MapPicker } from "@/components/ui/map-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Clock, MapPin } from "lucide-react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUploader } from "@/components/ui/image-uploader"

const formSchema = z.object({
  title: z.string().min(2, {
    message: I18n.t('events.edit.form.validation.title_min'),
  }),
  timezone: z.string().optional(),
  event_start_date: z.date().optional(),
  event_start_time: z.string().optional(),
  event_end_date: z.date().optional(),
  event_end_time: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  venue: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  address: z.string().optional(),
  cover: z.any().optional(),
  state: z.enum(["published", "draft"]).default("draft"),
})

export default function Overview() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const { setErrors } = useContext(EventEditContext)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleImageUpload = async (blobId, cropData) => {
    try {
      const response = await put(`/events/${slug}`, {
        body: JSON.stringify({
          event: {
            cover: blobId,
            crop_data: cropData ? JSON.stringify(cropData) : null
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const data = await response.json
        setEvent(data.event)
        toast({
          title: I18n.t('events.edit.form.messages.success'),
          description: I18n.t('events.edit.form.cover_success'),
        })
      }
    } catch (error) {
      console.error('Error updating event cover:', error)
      toast({
        title: I18n.t('events.edit.form.messages.error'),
        description: I18n.t('events.edit.form.cover_error'),
        variant: "destructive",
      })
    }
  }

  const form = useForm({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      timezone: '',
      description: '',
      location: '',
      venue: '',
      event_start_date: '',
      event_start_time: '',
      event_end_date: '',
      event_end_time: '',
      lat: '',
      lng: '',
      state: 'draft',
    }
  })

  React.useEffect(() => {
    const loadEventData = async () => {
      try {
        const response = await fetch(`/events/${slug}/edit.json`)
        const data = await response.json()

        setEvent(data)

        const startDate = new Date(data.event_start)
        const endDate = new Date(data.event_ends)

        form.reset({
          title: data.title,
          timezone: data.timezone,
          event_start_date: startDate,
          event_start_time: format(startDate, "HH:mm"),
          event_end_date: endDate,
          event_end_time: format(endDate, "HH:mm"),
          description: data.description,
          location: data.location,
          venue: data.venue,
          lat: data.lat,
          lng: data.lng,
          state: data.state || 'draft',
          cover: data.cover_blob_id
        })
      } catch (error) {
        console.error('Error loading event:', error)
        setErrors('Failed to load event data')
      }
    }

    loadEventData()
  }, [slug])

  const onSubmit = async (values) => {
    console.log("onSubmit called with values:", values)

    try {
      console.log("Starting form submission process")
      const formData = new FormData()
      // Combine date and time for start and end
      const startDateTime = new Date(values.event_start_date)
      const [startHours, startMinutes] = values.event_start_time.split(':')
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))

      const endDateTime = new Date(values.event_end_date)
      const [endHours, endMinutes] = values.event_end_time.split(':')
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))

      const formattedData = {
        ...values,
        event_start: startDateTime.toISOString(),
        event_ends: endDateTime.toISOString(),
      }

      // Clean up form fields that shouldn't be sent to API
      delete formattedData.event_start_date
      delete formattedData.event_start_time
      delete formattedData.event_end_date
      delete formattedData.event_end_time

      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] !== undefined && formattedData[key] !== null) {
          if (typeof formattedData[key] === 'object') {
            Object.keys(formattedData[key]).forEach(subKey => {
              formData.append(`event[${key}][${subKey}]`, formattedData[key][subKey])
            })
          } else {
            formData.append(`event[${key}]`, formattedData[key])
          }
        }
      })

      console.log("Sending form data:", formData)
      const response = await put(`/events/${slug}.json`, {
        body: formData,
        contentType: false,
        processData: false,
      })

      console.log("Response received:", response)
      const responseData = await response.json
      console.log("Response data:", responseData)

      if (response.ok) {
        setEvent(responseData.event)
        setErrors(null)
        toast({
          title: I18n.t('events.edit.form.messages.success'),
          description: I18n.t('events.edit.form.success'),
        })
      } else {
        setErrors(responseData.errors)
        Object.keys(responseData.errors).forEach((key) => {
          form.setError(key, {
            type: 'manual',
            message: responseData.errors[key][0]
          })
        })
      }
    } catch (error) {
      console.error('Error updating event:', error)
      setErrors(I18n.t('events.edit.form.error_saving'))
      toast({
        title: I18n.t('events.edit.form.messages.error'),
        description: I18n.t('events.edit.form.error'),
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <div className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('events.edit.form.title.label')}</FormLabel>
              <FormControl>
                <Input placeholder={I18n.t('events.edit.form.title.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('events.edit.form.timezone.label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={I18n.t('events.edit.form.timezone.placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="America/Santiago">America/Santiago</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="event_start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{I18n.t('events.edit.form.start_date.label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{I18n.t('events.edit.form.start_date.placeholder')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('events.edit.form.start_time.label')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        type="time"
                        {...field}
                        className="w-full"
                      />
                      <Clock className="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="event_end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{I18n.t('events.edit.form.end_date.label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{I18n.t('events.edit.form.end_date.placeholder')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < form.watch("event_start_date")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('events.edit.form.end_time.label')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        type="time"
                        {...field}
                        className="w-full"
                      />
                      <Clock className="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{I18n.t('events.edit.form.location.label')}</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {field.value}
                    {field.lat} {field.lng}
                    <MapPicker
                      value={{
                        lat: form.watch('lat'),
                        lng: form.watch('lng'),
                        address: field.value
                      }}
                      onChange={(location) => {
                        console.log("ON CHANGED LOCATION", location)
                        field.onChange(location.address)
                        form.setValue('lat', location.lat.toString())
                        form.setValue('lng', location.lng.toString())
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('events.edit.form.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={I18n.t('events.edit.form.description.placeholder')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('events.edit.form.venue.label')}</FormLabel>
              <FormControl>
                <Input placeholder={I18n.t('events.edit.form.venue.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cover"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('events.edit.form.cover.label')}</FormLabel>
              <FormControl>
                <ImageUploader
                  value={field.value}
                  onUploadComplete={(blob, cropData) => {
                    field.onChange(blob)
                    handleImageUpload(blob, cropData)
                  }}
                  aspectRatio={1}
                  preview={true}
                  enableCropper={true}
                  imageUrl={event?.cover_url?.large}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{I18n.t('events.edit.form.state.label')}</FormLabel>
                <FormDescription>
                  {I18n.t('events.edit.form.state.description')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === 'published'}
                  onCheckedChange={(checked) => {
                    field.onChange(checked ? 'published' : 'draft')
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div>
          <Button
            type="button"
            onClick={form.handleSubmit(async (values) => {
              if (isSubmitting) return

              try {
                setIsSubmitting(true)
                console.log("Submit button clicked with values:", values)
                await onSubmit(values)
              } catch (error) {
                console.error("Error during submission:", error)
                setErrors(I18n.t('events.edit.form.error'))
              } finally {
                setIsSubmitting(false)
              }
            })}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : I18n.t('events.edit.form.save')}
          </Button>
        </div>
      </div>
    </Form>
  )
}
