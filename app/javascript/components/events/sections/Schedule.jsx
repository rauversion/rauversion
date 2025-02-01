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
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
})

const formSchema = z.object({
  schedule_items: z.array(scheduleItemSchema)
})

export default function Schedule() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schedule_items: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedule_items"
  })

  React.useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`/events/${slug}/schedule.json`)
        const data = await response.json()
        setEvent(data.event)
        form.reset({
          schedule_items: data.event.schedule_items?.map(item => ({
            ...item,
            starts_at: format(new Date(item.starts_at), "yyyy-MM-dd'T'HH:mm"),
            ends_at: format(new Date(item.ends_at), "yyyy-MM-dd'T'HH:mm"),
          })) || []
        })
      } catch (error) {
        console.error('Error fetching schedule:', error)
        toast({
          title: "Error",
          description: "Could not load schedule",
          variant: "destructive",
        })
      }
    }
    fetchSchedule()
  }, [slug])

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}/schedule.json`, {
        body: JSON.stringify({
          event: {
            schedule_items_attributes: data.schedule_items
          }
        }),
        responseKind: 'json'
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

  const addScheduleItem = () => {
    append({
      title: "",
      description: "",
      starts_at: "",
      ends_at: ""
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Schedule Items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addScheduleItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Starts At</TableHead>
              <TableHead>Ends At</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`schedule_items.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`schedule_items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`schedule_items.${index}.starts_at`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`schedule_items.${index}.ends_at`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button type="submit">Save Schedule</Button>
      </form>
    </Form>
  )
}
