import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, isValid, parseISO } from "date-fns"
import { get, put } from '@rails/request.js'
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { DateTimeRangePicker } from "@/components/ui/date-time-range-picker"
import cn from "classnames"
import { formatDateSafely } from "@/hooks/safeDate"

const schedulingSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: I18n.t('events.edit.schedule.messages.validation.name_min') }),
  short_description: z.string().optional(),
  start_date: z.string().min(1, { message: I18n.t('events.edit.schedule.messages.validation.start_date_required') }),
  end_date: z.string().min(1, { message: I18n.t('events.edit.schedule.messages.validation.end_date_required') }),
  _destroy: z.boolean().optional(),
})

const scheduleItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, {
    message: I18n.t('events.edit.schedule.messages.validation.name_min'),
  }),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: I18n.t('events.edit.schedule.messages.validation.start_date_required') }),
  end_date: z.string().min(1, { message: I18n.t('events.edit.schedule.messages.validation.end_date_required') }),
  schedule_type: z.string().optional(),
  _destroy: z.boolean().optional(),
  schedule_schedulings_attributes: z.array(schedulingSchema).optional(),
})

const formSchema = z.object({
  event_schedules_attributes: z.array(scheduleItemSchema)
})

export default function Schedule() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [destroyedItems, setDestroyedItems] = React.useState(new Set())
  const [destroyedSchedulings, setDestroyedSchedulings] = React.useState({})

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      const response = await get(`/events/${slug}.json`)
      const data = await response.json
      
      setEvent(data)
      
      const schedules = data.event_schedules?.map(schedule => {
        const start_date = formatDateSafely(schedule.start_date)
        const end_date = formatDateSafely(schedule.end_date)
        
        const schedule_schedulings_attributes = schedule.schedulings?.map(scheduling => ({
          id: scheduling.id,
          name: scheduling.name || "",
          short_description: scheduling.short_description || "",
          start_date: formatDateSafely(scheduling.start_date),
          end_date: formatDateSafely(scheduling.end_date),
          _destroy: false
        })) || []
        
        return {
          id: schedule.id,
          name: schedule.name || "",
          description: schedule.description || "",
          start_date,
          end_date,
          schedule_type: schedule.schedule_type || "session",
          _destroy: false,
          schedule_schedulings_attributes
        }
      }) || []
      
      return {
        event_schedules_attributes: schedules
      }
    },
    mode: "onChange"
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "event_schedules_attributes"
  })

  const visibleFields = React.useMemo(() => {
    return fields.filter((field, index) => {
      const values = form.getValues(`event_schedules_attributes.${index}`)
      return !destroyedItems.has(index)
    })
  }, [fields, destroyedItems, form])

  const handleSchedulingDelete = (scheduleIndex, schedulingIndex) => {
    const schedulingId = form.getValues(
      `event_schedules_attributes.${scheduleIndex}.schedule_schedulings_attributes.${schedulingIndex}.id`
    )

    if (schedulingId) {
      form.setValue(
        `event_schedules_attributes.${scheduleIndex}.schedule_schedulings_attributes.${schedulingIndex}._destroy`,
        true,
        { shouldDirty: true }
      )
      setDestroyedSchedulings(prev => ({
        ...prev,
        [scheduleIndex]: {
          ...(prev[scheduleIndex] || {}),
          [schedulingIndex]: true
        }
      }))
    } else {
      const currentSchedulings = form.getValues(
        `event_schedules_attributes.${scheduleIndex}.schedule_schedulings_attributes`
      )
      form.setValue(
        `event_schedules_attributes.${scheduleIndex}.schedule_schedulings_attributes`,
        currentSchedulings.filter((_, i) => i !== schedulingIndex),
        { shouldDirty: true }
      )
    }
  }

  const isSchedulingVisible = (scheduleIndex, schedulingIndex) => {
    return !destroyedSchedulings[scheduleIndex]?.[schedulingIndex]
  }

  const onSubmit = async (values) => {
    try {
      const formData = new FormData()
      
      values.event_schedules_attributes.forEach((item, index) => {
        if (item.id) {
          formData.append(`event[event_schedules_attributes][${index}][id]`, item.id)
        }

        if (item._destroy) {
          formData.append(`event[event_schedules_attributes][${index}][_destroy]`, '1')
          return
        }

        const start_date = formatDateSafely(item.start_date)
        const end_date = formatDateSafely(item.end_date)

        formData.append(`event[event_schedules_attributes][${index}][start_date]`, start_date)
        formData.append(`event[event_schedules_attributes][${index}][end_date]`, end_date)
        formData.append(`event[event_schedules_attributes][${index}][name]`, item.name)
        formData.append(`event[event_schedules_attributes][${index}][description]`, item.description || '')
        formData.append(`event[event_schedules_attributes][${index}][schedule_type]`, item.schedule_type || 'session')

        if (item.schedule_schedulings_attributes) {
          item.schedule_schedulings_attributes.forEach((scheduling, schedulingIndex) => {
            if (scheduling.id) {
              formData.append(
                `event[event_schedules_attributes][${index}][schedule_schedulings_attributes][${schedulingIndex}][id]`, 
                scheduling.id
              )
            }

            if (scheduling._destroy) {
              formData.append(
                `event[event_schedules_attributes][${index}][schedule_schedulings_attributes][${schedulingIndex}][_destroy]`, 
                '1'
              )
              return
            }

            const schedulingStartDate = formatDateSafely(scheduling.start_date)
            const schedulingEndDate = formatDateSafely(scheduling.end_date)

            formData.append(
              `event[event_schedules_attributes][${index}][schedule_schedulings_attributes][${schedulingIndex}][start_date]`,
              schedulingStartDate
            )
            formData.append(
              `event[event_schedules_attributes][${index}][schedule_schedulings_attributes][${schedulingIndex}][end_date]`,
              schedulingEndDate
            )
            formData.append(
              `event[event_schedules_attributes][${index}][schedule_schedulings_attributes][${schedulingIndex}][name]`,
              scheduling.name
            )
            formData.append(
              `event[event_schedules_attributes][${index}][schedule_schedulings_attributes][${schedulingIndex}][short_description]`,
              scheduling.short_description || ''
            )
          })
        }
      })

      const response = await put(`/events/${slug}.json`, {
        body: formData,
      })

      const data = await response.json
      
      if (data.errors) {
        form.clearErrors()
        
        Object.entries(data.errors).forEach(([key, messages]) => {
          if (key.includes('schedule_schedulings.')) {
            const [_, scheduleIndex, __, field] = key.split('.')
            const schedulingPath = `event_schedules_attributes.${scheduleIndex}.schedule_schedulings_attributes`
            
            const schedulings = form.getValues(schedulingPath) || []
            schedulings.forEach((_, schedulingIndex) => {
              form.setError(`${schedulingPath}.${schedulingIndex}.${field}`, {
                type: 'server',
                message: Array.isArray(messages) ? messages[0] : messages
              })
            })
          } else if (key.startsWith('event_schedules_attributes.')) {
            const [_, index, field] = key.split('.')
            form.setError(`event_schedules_attributes.${index}.${field}`, {
              type: 'server',
              message: Array.isArray(messages) ? messages[0] : messages
            })
          } else {
            form.setError(key, {
              type: 'server',
              message: Array.isArray(messages) ? messages[0] : messages
            })
          }
        })

        toast({
          title: "Error",
          description: I18n.t('events.edit.schedule.messages.form_error'),
          variant: "destructive",
        })
      } else {
        setEvent(data.event)
        toast({
          title: "Success",
          description: I18n.t('events.edit.schedule.messages.success'),
        })
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast({
        title: "Error",
        description: I18n.t('events.edit.schedule.messages.error'),
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{I18n.t('events.edit.schedule.title')}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                append({
                  name: "",
                  description: "",
                  start_date: new Date().toISOString(),
                  end_date: new Date().toISOString(),
                  schedule_type: "session",
                  _destroy: false,
                  schedule_schedulings_attributes: []
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {I18n.t('events.edit.schedule.add_item')}
            </Button>
          </div>

          <div className="space-y-4">
            {visibleFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name={`event_schedules_attributes.${index}.id`}
                    render={({ field }) => (
                      <Input type="hidden" {...field} />
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`event_schedules_attributes.${index}._destroy`}
                    render={({ field }) => (
                      <Input type="hidden" {...field} />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`event_schedules_attributes.${index}.name`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('events.edit.schedule.name')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className={cn(
                              fieldState.error && "border-red-500",
                              form.formState.errors?.event_schedules_attributes?.[index]?.name && "border-red-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage>
                          {fieldState.error?.message || 
                           form.formState.errors?.event_schedules_attributes?.[index]?.name?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`event_schedules_attributes.${index}.description`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('events.edit.schedule.description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            className={cn(
                              fieldState.error && "border-red-500",
                              form.formState.errors?.event_schedules_attributes?.[index]?.description && "border-red-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage>
                          {fieldState.error?.message || 
                           form.formState.errors?.event_schedules_attributes?.[index]?.description?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>{I18n.t('events.edit.schedule.date_time_range')}</FormLabel>
                    <DateTimeRangePicker
                      startDate={form.watch(`event_schedules_attributes.${index}.start_date`)}
                      endDate={form.watch(`event_schedules_attributes.${index}.end_date`)}
                      onStartDateChange={(date) => {
                        form.setValue(`event_schedules_attributes.${index}.start_date`, date, { 
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true
                        })
                      }}
                      onEndDateChange={(date) => {
                        form.setValue(`event_schedules_attributes.${index}.end_date`, date, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true
                        })
                      }}
                      error={
                        form.formState.errors?.event_schedules_attributes?.[index]?.start_date || 
                        form.formState.errors?.event_schedules_attributes?.[index]?.end_date
                      }
                    />
                    <div className="text-sm font-medium text-destructive">
                      {form.formState.errors?.event_schedules_attributes?.[index]?.start_date?.message}
                      {form.formState.errors?.event_schedules_attributes?.[index]?.end_date?.message && (
                        <div>{form.formState.errors?.event_schedules_attributes?.[index]?.end_date?.message}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mt-4 pl-4 border-l">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">{I18n.t('events.edit.schedule.schedulings.title')}</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentSchedulings = form.getValues(`event_schedules_attributes.${index}.schedule_schedulings_attributes`) || []
                          form.setValue(`event_schedules_attributes.${index}.schedule_schedulings_attributes`, [
                            ...currentSchedulings,
                            {
                              name: "",
                              short_description: "",
                              start_date: new Date().toISOString(),
                              end_date: new Date().toISOString(),
                              _destroy: false
                            }
                          ])
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {I18n.t('events.edit.schedule.schedulings.add')}
                      </Button>
                    </div>

                    {form.watch(`event_schedules_attributes.${index}.schedule_schedulings_attributes`)?.map((scheduling, schedulingIndex) => (
                      isSchedulingVisible(index, schedulingIndex) && (
                        <div key={schedulingIndex} className="space-y-4 p-3 bg-muted rounded-md">
                          <FormField
                            control={form.control}
                            name={`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.id`}
                            render={({ field }) => (
                              <Input type="hidden" {...field} />
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}._destroy`}
                            render={({ field }) => (
                              <Input type="hidden" {...field} />
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.name`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.schedule.schedulings.name')}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className={cn(
                                      "text-sm",
                                      fieldState.error && "border-red-500",
                                      form.formState.errors?.event_schedules_attributes?.[index]
                                        ?.schedule_schedulings_attributes?.[schedulingIndex]?.name && "border-red-500"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage>
                                  {fieldState.error?.message || 
                                   form.formState.errors?.event_schedules_attributes?.[index]
                                     ?.schedule_schedulings_attributes?.[schedulingIndex]?.name?.message}
                                </FormMessage>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.short_description`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.schedule.schedulings.short_description')}</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    className={cn(
                                      "text-sm",
                                      fieldState.error && "border-red-500",
                                      form.formState.errors?.event_schedules_attributes?.[index]
                                        ?.schedule_schedulings_attributes?.[schedulingIndex]?.short_description && "border-red-500"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage>
                                  {fieldState.error?.message || 
                                   form.formState.errors?.event_schedules_attributes?.[index]
                                     ?.schedule_schedulings_attributes?.[schedulingIndex]?.short_description?.message}
                                </FormMessage>
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <FormLabel>{I18n.t('events.schedule.schedulings.date_time_range')}</FormLabel>
                            <DateTimeRangePicker
                              startDate={form.watch(`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.start_date`)}
                              endDate={form.watch(`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.end_date`)}
                              onStartDateChange={(date) => {
                                form.setValue(`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.start_date`, date, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true
                                })
                              }}
                              onEndDateChange={(date) => {
                                form.setValue(`event_schedules_attributes.${index}.schedule_schedulings_attributes.${schedulingIndex}.end_date`, date, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true
                                })
                              }}
                              error={
                                form.formState.errors?.event_schedules_attributes?.[index]
                                  ?.schedule_schedulings_attributes?.[schedulingIndex]?.start_date ||
                                form.formState.errors?.event_schedules_attributes?.[index]
                                  ?.schedule_schedulings_attributes?.[schedulingIndex]?.end_date
                              }
                            />
                            <div className="text-sm font-medium text-destructive">
                              {form.formState.errors?.event_schedules_attributes?.[index]
                                ?.schedule_schedulings_attributes?.[schedulingIndex]?.start_date?.message}
                              {form.formState.errors?.event_schedules_attributes?.[index]
                                ?.schedule_schedulings_attributes?.[schedulingIndex]?.end_date?.message && (
                                <div>
                                  {form.formState.errors?.event_schedules_attributes?.[index]
                                    ?.schedule_schedulings_attributes?.[schedulingIndex]?.end_date?.message}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSchedulingDelete(index, schedulingIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const id = form.getValues(`event_schedules_attributes.${index}.id`)
                    if (id) {
                      form.setValue(`event_schedules_attributes.${index}._destroy`, true, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true
                      })
                      setDestroyedItems(prev => new Set([...prev, index]))
                    } else {
                      remove(index)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit">{I18n.t('events.edit.schedule.save')}</Button>
      </form>
    </Form>
  )
}
