import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, isValid } from "date-fns"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { DateTimeRangePicker } from "@/components/ui/date-time-range-picker"
import cn from "classnames"

const scheduleItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
  schedule_type: z.string().optional(),
  _destroy: z.boolean().optional(),
})

const formSchema = z.object({
  event_schedules_attributes: z.array(scheduleItemSchema)
})

const formatDateSafely = (dateString) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    return isValid(date) ? date.toISOString() : ""
  } catch (error) {
    console.error('Error formatting date:', error)
    return ""
  }
}

export default function Schedule() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      const response = await fetch(`/events/${slug}.json`)
      const data = await response.json()
      console.log("Initial form data:", data)
      
      setEvent(data)
      
      const schedules = data.event_schedules?.map(schedule => ({
        id: schedule.id,
        name: schedule.name || "",
        description: schedule.description || "",
        start_date: formatDateSafely(schedule.start_date),
        end_date: formatDateSafely(schedule.end_date),
        schedule_type: schedule.schedule_type || "session",
        _destroy: false
      })) || []

      console.log("Formatted schedules:", schedules)
      
      return {
        event_schedules_attributes: schedules
      }
    },
    mode: "onChange"
  })

  // Debug current form values
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form Values:", value)
    })
    return () => subscription.unsubscribe()
  }, [form])

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "event_schedules_attributes"
  })

  const visibleFields = fields.filter(field => {
    const values = form.getValues(`event_schedules_attributes.${field.id}`)
    return !values?._destroy
  })

  const onSubmit = async (values) => {
    try {
      const formData = new FormData()
      
      values.event_schedules_attributes.forEach((item, index) => {
        if (item.id) {
          formData.append(`event[event_schedules_attributes][${index}][id]`, item.id)
        }

        if (item._destroy) {
          formData.append(`event[event_schedules_attributes][${index}][_destroy]`, item._destroy)
          return
        }

        Object.keys(item).forEach(key => {
          if (key !== 'id' && key !== '_destroy' && item[key] !== undefined && item[key] !== null) {
            formData.append(`event[event_schedules_attributes][${index}][${key}]`, item[key])
          }
        })
      })

      const response = await put(`/events/${slug}.json`, {
        body: formData,
      })

      const data = await response.json
      console.log("Response data:", data)
      
      if (data.errors) {
        // Clear any previous errors first
        form.clearErrors()
        
        Object.entries(data.errors).forEach(([key, messages]) => {
          console.log("Setting error for:", key, messages)
          
          if (key.startsWith('event_schedules_attributes.')) {
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
          description: "Please check the form for errors",
          variant: "destructive",
        })
      } else {
        setEvent(data.event)
        toast({
          title: "Success",
          description: "Schedule updated successfully",
        })
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast({
        title: "Error",
        description: "Could not update schedule",
        variant: "destructive",
      })
    }
  }

  // Debug errors
  React.useEffect(() => {
    console.log("Form State Errors:", form.formState.errors)
  }, [form.formState.errors])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Schedule Items</h2>
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
                  schedule_type: "session"
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {visibleFields.map((field, index) => {
              // Get the actual values for this field
              const fieldValues = form.getValues(`event_schedules_attributes.${index}`)
              
              return (
                <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg">
                  <div className="flex-1 space-y-4">
                    <FormField
                      control={form.control}
                      name={`event_schedules_attributes.${index}.name`}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
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
                          <FormLabel>Description</FormLabel>
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
                      <FormLabel>Date & Time Range</FormLabel>
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
                        field: {index}
                        {form.formState.errors?.event_schedules_attributes?.[index]?.start_date?.message}
                        {form.formState.errors?.event_schedules_attributes?.[index]?.end_date?.message && (
                          <div>{form.formState.errors?.event_schedules_attributes?.[index]?.end_date?.message}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentValues = form.getValues(`event_schedules_attributes.${index}`)
                      if (currentValues.id) {
                        form.setValue(`event_schedules_attributes.${index}`, {
                          ...currentValues,
                          _destroy: true
                        }, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true
                        })
                      } else {
                        remove(index)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <Button type="submit">Save Schedule</Button>
      </form>
    </Form>
  )
}
