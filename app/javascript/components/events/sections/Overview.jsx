import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import I18n from 'stores/locales'
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
import { ImageUploader } from "@/components/ui/image-uploader"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  timezone: z.string(),
  event_start_date: z.date(),
  event_start_time: z.string(),
  event_end_date: z.date(),
  event_end_time: z.string(),
  description: z.string(),
  location: z.string(),
  venue: z.string(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  address: z.string().optional(),
  cover: z.any().optional(),
})

export default function Overview() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      const response = await fetch(`/events/${slug}/edit.json`)
      const data = await response.json()
      
      setEvent(data)
      
      const startDate = new Date(data.event_start)
      const endDate = new Date(data.event_ends)
      
      return {
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
      }
    }
  })

  const onSubmit = async (values) => {
    try {
      const formData = new FormData()
      
      // Combine date and time for start and end
      const startDateTime = new Date(values.event_start_date)
      const [startHours, startMinutes] = values.event_start_time.split(':')
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes))
      
      const endDateTime = new Date(values.event_end_date)
      const [endHours, endMinutes] = values.event_end_time.split(':')
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes))
      
      const data = {
        ...values,
        event_start: startDateTime.toISOString(),
        event_ends: endDateTime.toISOString(),
      }
      
      // Clean up form fields that shouldn't be sent to API
      delete data.event_start_date
      delete data.event_start_time
      delete data.event_end_date
      delete data.event_end_time
      
      // Format location data
      if (data.lat && data.lng) {
        data.location_attributes = {
          address: data.address || data.location,
          lat: data.lat,
          lng: data.lng
        }
        delete data.lat
        delete data.lng
        delete data.address
      }
      
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          if (typeof data[key] === 'object') {
            Object.keys(data[key]).forEach(subKey => {
              formData.append(`event[${key}][${subKey}]`, data[key][subKey])
            })
          } else {
            formData.append(`event[${key}]`, data[key])
          }
        }
      })

      const response = await put(`/events/${slug}.json`, {
        body: formData,
      })

      if (response.ok) {
        const { event } = await response.json
        setEvent(event)
        toast({
          title: "Success",
          description: I18n.t('events.edit.form.success'),
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
      console.error('Error updating event:', error)
      toast({
        title: "Error",
        description: I18n.t('events.edit.form.error'),
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <MapPicker
                      value={{
                        lat: form.watch('lat'),
                        lng: form.watch('lng'),
                        address: field.value
                      }}
                      onChange={(location) => {
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

        <Button type="submit">{I18n.t('events.edit.form.save')}</Button>
      </form>
    </Form>
  )
}
