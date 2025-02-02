import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"

const scheduleItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  schedule_type: z.string().optional(),
  _destroy: z.boolean().optional(),
})

const formSchema = z.object({
  event_schedules_attributes: z.array(scheduleItemSchema)
})

export default function Schedule() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      const response = await fetch(`/events/${slug}.json`)
      const data = await response.json()
      setEvent(data)
      
      return {
        event_schedules_attributes: data.event_schedules?.map(schedule => ({
          id: schedule.id,
          name: schedule.name,
          description: schedule.description,
          start_date: format(new Date(schedule.start_date), "yyyy-MM-dd'T'HH:mm"),
          end_date: format(new Date(schedule.end_date), "yyyy-MM-dd'T'HH:mm"),
          schedule_type: schedule.schedule_type
        })) || []
      }
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "event_schedules_attributes"
  })

  const onSubmit = async (values) => {
    try {
      const formData = new FormData()
      
      values.event_schedules_attributes.forEach((item, index) => {
        Object.keys(item).forEach(key => {
          if (item[key] !== undefined && item[key] !== null) {
            formData.append(`event[event_schedules_attributes][${index}][${key}]`, item[key])
          }
        })
      })

      const response = await put(`/events/${slug}.json`, {
        body: formData,
      })

      if (response.ok) {
        const { event } = await response.json
        setEvent(event)
        toast({
          title: "Success",
          description: "Schedule updated successfully",
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
      console.error('Error updating schedule:', error)
      toast({
        title: "Error",
        description: "Could not update schedule",
        variant: "destructive",
      })
    }
  }

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
                  start_date: "",
                  end_date: "",
                  schedule_type: "session"
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name={`event_schedules_attributes.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`event_schedules_attributes.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`event_schedules_attributes.${index}.start_date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`event_schedules_attributes.${index}.end_date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (field.id) {
                      const currentValue = form.getValues(`event_schedules_attributes.${index}`)
                      form.setValue(`event_schedules_attributes.${index}`, {
                        ...currentValue,
                        _destroy: true
                      })
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

        <Button type="submit">Save Schedule</Button>
      </form>
    </Form>
  )
}
