import React, { useContext } from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import I18n from 'stores/locales'
import { EventEditContext } from "../EventEdit"
import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers"
import * as z from "zod"
import { format } from "date-fns"
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

const nullableString = z.preprocess((value) => value == null ? "" : String(value), z.string())
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
const validationMessages = {
  timezoneRequired: I18n.t('events.edit.form.validation.timezone_required', {
    defaultValue: 'Selecciona una zona horaria.',
  }),
  startDateRequired: I18n.t('events.edit.form.validation.start_date_required', {
    defaultValue: 'Selecciona una fecha de inicio.',
  }),
  startTimeRequired: I18n.t('events.edit.form.validation.start_time_required', {
    defaultValue: 'Selecciona una hora de inicio valida.',
  }),
  endDateRequired: I18n.t('events.edit.form.validation.end_date_required', {
    defaultValue: 'Selecciona una fecha de termino.',
  }),
  endTimeRequired: I18n.t('events.edit.form.validation.end_time_required', {
    defaultValue: 'Selecciona una hora de termino valida.',
  }),
  endAfterStart: I18n.t('events.edit.form.validation.end_after_start', {
    defaultValue: 'La fecha y hora de termino debe ser posterior al inicio.',
  }),
}

function combineDateAndTime(dateValue, timeValue) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) return null
  if (typeof timeValue !== "string") return null

  const match = timeValue.match(timePattern)
  if (!match) return null

  const combined = new Date(dateValue)
  combined.setHours(Number(match[1]), Number(match[2]), 0, 0)

  return Number.isNaN(combined.getTime()) ? null : combined
}

const requiredNullableString = (message) =>
  z.preprocess((value) => value == null ? "" : String(value), z.string().trim().min(1, message))

const zodResolverCompat = (schema) => async (values, _context, options) => {
  const result = await schema.safeParseAsync(values)

  if (result.success) {
    if (options.shouldUseNativeValidation) {
      validateFieldsNatively({}, options)
    }

    return {
      values: result.data,
      errors: {},
    }
  }

  const fieldErrors = result.error.issues.reduce((acc, issue) => {
    const path = issue.path.join(".")
    if (!path || acc[path]) return acc

    acc[path] = {
      type: issue.code,
      message: issue.message,
    }

    return acc
  }, {})

  return {
    values: {},
    errors: toNestErrors(fieldErrors, options),
  }
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: I18n.t('events.edit.form.validation.title_min'),
  }),
  timezone: requiredNullableString(validationMessages.timezoneRequired),
  event_start_date: z.date().optional(),
  event_start_time: z.string().optional(),
  event_end_date: z.date().optional(),
  event_end_time: z.string().optional(),
  description: nullableString,
  location: nullableString,
  venue: nullableString,
  lat: nullableString,
  lng: nullableString,
  address: nullableString,
  cover: z.any().optional(),
  state: z.enum(["published", "draft"]).default("draft"),
}).superRefine((values, ctx) => {
  if (!(values.event_start_date instanceof Date) || Number.isNaN(values.event_start_date.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_start_date"],
      message: validationMessages.startDateRequired,
    })
  }

  if (!timePattern.test(values.event_start_time || "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_start_time"],
      message: validationMessages.startTimeRequired,
    })
  }

  if (!(values.event_end_date instanceof Date) || Number.isNaN(values.event_end_date.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_end_date"],
      message: validationMessages.endDateRequired,
    })
  }

  if (!timePattern.test(values.event_end_time || "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_end_time"],
      message: validationMessages.endTimeRequired,
    })
  }

  const startDateTime = combineDateAndTime(values.event_start_date, values.event_start_time)
  const endDateTime = combineDateAndTime(values.event_end_date, values.event_end_time)

  if (startDateTime && endDateTime && endDateTime <= startDateTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_end_date"],
      message: validationMessages.endAfterStart,
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_end_time"],
      message: validationMessages.endAfterStart,
    })
  }
})

function normalizeText(value) {
  return value == null ? "" : String(value)
}

function parseEventDate(value) {
  if (!value) return undefined

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export default function Overview() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const { setErrors } = useContext(EventEditContext)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showMapEditor, setShowMapEditor] = React.useState(false)

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
    resolver: zodResolverCompat(formSchema),
    defaultValues: {
      title: '',
      timezone: '',
      description: '',
      location: '',
      venue: '',
      event_start_date: undefined,
      event_start_time: '',
      event_end_date: undefined,
      event_end_time: '',
      lat: '',
      lng: '',
      state: 'draft',
    }
  })

  const locationValue = form.watch("location")
  const latitude = form.watch("lat")
  const longitude = form.watch("lng")
  const hasCoordinates = Boolean(latitude && longitude)

  React.useEffect(() => {
    const loadEventData = async () => {
      try {
        const response = await fetch(`/events/${slug}/edit.json`)
        const data = await response.json()

        setEvent(data)

        const startDate = parseEventDate(data.event_start)
        const endDate = parseEventDate(data.event_ends)

        form.reset({
          title: normalizeText(data.title),
          timezone: normalizeText(data.timezone),
          event_start_date: startDate,
          event_start_time: startDate ? format(startDate, "HH:mm") : "",
          event_end_date: endDate,
          event_end_time: endDate ? format(endDate, "HH:mm") : "",
          description: normalizeText(data.description),
          location: normalizeText(data.location),
          venue: normalizeText(data.venue),
          lat: normalizeText(data.lat),
          lng: normalizeText(data.lng),
          state: data.state || 'draft',
          cover: data.cover_blob_id
        })
        setShowMapEditor(Boolean(data.lat || data.lng))
      } catch (error) {
        console.error('Error loading event:', error)
        setErrors('Failed to load event data')
      }
    }

    loadEventData()
  }, [slug])

  const handleValidSubmit = async (values) => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await onSubmit(values)
    } catch (error) {
      console.error("Error during submission:", error)
      setErrors(I18n.t('events.edit.form.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInvalidSubmit = () => {
    setErrors(null)
  }

  const handleMapChange = React.useCallback((location) => {
    const currentAddress = form.getValues("location") ?? ""
    const currentLat = form.getValues("lat") ?? ""
    const currentLng = form.getValues("lng") ?? ""

    const nextAddress = location.address ?? currentAddress
    const nextLat = location.lat != null ? location.lat.toString() : ""
    const nextLng = location.lng != null ? location.lng.toString() : ""

    if (currentAddress !== nextAddress) {
      form.setValue("location", nextAddress, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    }

    if (currentLat !== nextLat) {
      form.setValue("lat", nextLat, {
        shouldDirty: true,
        shouldTouch: true,
      })
    }

    if (currentLng !== nextLng) {
      form.setValue("lng", nextLng, {
        shouldDirty: true,
        shouldTouch: true,
      })
    }
  }, [form])

  const onSubmit = async (values) => {
    try {
      const formData = new FormData()
      const startDateTime = combineDateAndTime(values.event_start_date, values.event_start_time)
      const endDateTime = combineDateAndTime(values.event_end_date, values.event_end_time)

      if (!startDateTime) {
        form.setError("event_start_date", {
          type: "manual",
          message: validationMessages.startDateRequired,
        })
        form.setError("event_start_time", {
          type: "manual",
          message: validationMessages.startTimeRequired,
        })
        return
      }

      if (!endDateTime) {
        form.setError("event_end_date", {
          type: "manual",
          message: validationMessages.endDateRequired,
        })
        form.setError("event_end_time", {
          type: "manual",
          message: validationMessages.endTimeRequired,
        })
        return
      }

      if (endDateTime <= startDateTime) {
        form.setError("event_end_date", {
          type: "manual",
          message: validationMessages.endAfterStart,
        })
        form.setError("event_end_time", {
          type: "manual",
          message: validationMessages.endAfterStart,
        })
        return
      }

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

      const response = await put(`/events/${slug}.json`, {
        body: formData,
        contentType: false,
        processData: false,
      })

      const responseData = await response.json

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
      <form
        onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
        className="space-y-8"
        noValidate
      >
        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <FormField
              control={form.control}
              name="cover"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="space-y-1">
                    <FormLabel>{I18n.t('events.edit.form.cover.label')}</FormLabel>
                    <FormDescription>
                      {I18n.t('events.edit.form.cover.description', {
                        defaultValue: 'Usa una portada clara y cuadrada para que se vea bien en la pagina del evento.',
                      })}
                    </FormDescription>
                  </div>
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
                      className="mx-auto w-full max-w-sm p-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('events.edit.form.title.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={I18n.t('events.edit.form.title.placeholder')}
                      className="h-11 text-base"
                      {...field}
                    />
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
                  <FormLabel>{I18n.t('events.edit.form.description.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={I18n.t('events.edit.form.description.placeholder')}
                      className="min-h-[180px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('events.edit.form.timezone.label')}</FormLabel>
                    <Select
                      name={field.name}
                      onValueChange={(value) => {
                        field.onChange(value)
                        field.onBlur()
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(fieldState.error && "border-destructive focus:ring-destructive")}>
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

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="flex h-full flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
                    <div className="space-y-1 pr-4">
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
            </div>
          </div>
        </div>

        <section className="rounded-2xl border bg-background p-5">
          <div className="mb-5 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              {I18n.t('events.edit.form.schedule_heading', { defaultValue: 'Fecha y hora' })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {I18n.t('events.edit.form.schedule_description', { defaultValue: 'Define claramente cuándo empieza y cuándo termina el evento.' })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-xl border p-4">
              <FormField
                control={form.control}
                name="event_start_date"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{I18n.t('events.edit.form.start_date.label')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              fieldState.error && "border-destructive focus:ring-destructive"
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
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('events.edit.form.start_time.label')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="time"
                          {...field}
                          className={cn("w-full", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                        />
                        <Clock className="ml-2 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <FormField
                control={form.control}
                name="event_end_date"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{I18n.t('events.edit.form.end_date.label')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              fieldState.error && "border-destructive focus:ring-destructive"
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
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('events.edit.form.end_time.label')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="time"
                          {...field}
                          className={cn("w-full", fieldState.error && "border-destructive focus-visible:ring-destructive")}
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
        </section>

        <section className="rounded-2xl border bg-background p-5">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold tracking-tight">
                  {I18n.t('events.edit.form.location_heading', { defaultValue: 'Ubicación' })}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {I18n.t('events.edit.form.location_description', { defaultValue: 'Primero escribe el lugar como quieres mostrarlo. El mapa es opcional y sirve solo para ajustar el pin.' })}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMapEditor((current) => !current)}
            >
              {showMapEditor
                ? I18n.t('events.edit.form.hide_map', { defaultValue: 'Ocultar mapa' })
                : I18n.t('events.edit.form.show_map', { defaultValue: hasCoordinates ? 'Ajustar en mapa' : 'Agregar pin en mapa' })}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('events.edit.form.location.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={I18n.t('events.edit.form.location.placeholder', { defaultValue: 'Ej. Sala Metrónomo, Bellavista 123, Santiago' })}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {I18n.t('events.edit.form.location_help', { defaultValue: 'Este texto se muestra al publico incluso si no usas el mapa.' })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-5 rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {hasCoordinates
                    ? I18n.t('events.edit.form.map_status.selected', { defaultValue: 'Pin guardado' })
                    : I18n.t('events.edit.form.map_status.empty', { defaultValue: 'Sin pin guardado' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasCoordinates
                    ? I18n.t('events.edit.form.map_status.selected_description', { defaultValue: 'Puedes mover el pin si quieres afinar la ubicación exacta.' })
                    : I18n.t('events.edit.form.map_status.empty_description', { defaultValue: 'Si el mapa falla, puedes guardar el evento solo con el texto de ubicación.' })}
                </p>
              </div>

              {hasCoordinates && (
                <div className="rounded-full bg-background px-3 py-1 text-xs font-mono text-muted-foreground">
                  {latitude}, {longitude}
                </div>
              )}
            </div>

            {showMapEditor && (
              <div className="mt-4">
                <MapPicker
                  value={{
                    lat: latitude,
                    lng: longitude,
                    address: locationValue
                  }}
                  onChange={handleMapChange}
                  mapHeight={280}
                />
              </div>
            )}
          </div>
        </section>

        <div>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : I18n.t('events.edit.form.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
