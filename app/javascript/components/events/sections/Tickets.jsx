import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { get, put } from '@rails/request.js'
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
} from "@/components/ui/card"
import { Plus, Ticket, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "classnames"
import { formatDateSafely } from "@/hooks/safeDate"

const ticketSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0),
  qty: z.coerce.number().min(1),
  currency: z.string(),
  sale_start: z.date().nullable(),
  sale_end: z.date().nullable(),
  min_tickets_per_order: z.coerce.number().min(1),
  max_tickets_per_order: z.coerce.number().min(1),
  requires_shipping: z.boolean().default(false),
  show_remaining_count: z.boolean().default(true),
  _destroy: z.boolean().optional(),
})

const formSchema = z.object({
  tickets: z.array(ticketSchema)
})

const currencyOptions = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
]

export default function Tickets() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tickets: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tickets"
  })

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await get(`/events/${slug}.json`)
        const data = await response.json

        setEvent(data)
        
        // Reset form with current tickets
        form.reset({
          tickets: data.tickets?.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            short_description: ticket.short_description,
            price: ticket.price,
            qty: ticket.qty,
            currency: ticket.currency,
            sale_start: formatDateSafely(ticket.sale_start),
            sale_end: formatDateSafely(ticket.sale_end),
            min_tickets_per_order: ticket.min_tickets_per_order,
            max_tickets_per_order: ticket.max_tickets_per_order,
            requires_shipping: ticket.requires_shipping,
            show_remaining_count: ticket.show_remaining_count
          })) || []
        })
      } catch (error) {
        console.error('Error fetching tickets:', error)
        toast({
          title: "Error",
          description: "Could not load tickets",
          variant: "destructive",
        })
      }
    }

    fetchTickets()
  }, [slug])

  const onSubmit = async (data) => {
    try {
      const response = await put(`/events/${slug}/tickets.json`, {
        body: JSON.stringify({
          event: {
            tickets_attributes: data.tickets
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const { event } = await response.json
        setEvent(event)
        toast({
          title: "Success",
          description: "Tickets updated successfully",
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
      console.error('Error updating tickets:', error)
      toast({
        title: "Error",
        description: "Could not update tickets",
        variant: "destructive",
      })
    }
  }

  const addTicket = () => {
    append({
      name: "",
      short_description: "",
      price: 0,
      qty: 1,
      currency: "USD",
      sale_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      sale_end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      min_tickets_per_order: 1,
      max_tickets_per_order: 1,
      requires_shipping: false,
      show_remaining_count: true,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Event Tickets</CardTitle>
              <CardDescription>
                Create and manage tickets for your event
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addTicket}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        <CardTitle className="text-lg">
                          {field.title || "New Ticket"}
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`tickets.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="VIP Pass" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tickets.${index}.short_description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what's included"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`tickets.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tickets.${index}.currency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencyOptions.map((currency) => (
                                  <SelectItem 
                                    key={currency.value} 
                                    value={currency.value}
                                  >
                                    {currency.label}
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
                        name={`tickets.${index}.qty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`tickets.${index}.sale_start`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sale Start</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field}
                                value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : null
                                  field.onChange(date)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tickets.${index}.sale_end`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sale End</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field}
                                value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : null
                                  field.onChange(date)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`tickets.${index}.min_tickets_per_order`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Quantity per Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tickets.${index}.max_tickets_per_order`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Quantity per Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-6">
                      <FormField
                        control={form.control}
                        name={`tickets.${index}.requires_shipping`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Requires Shipping</FormLabel>
                              <FormDescription>
                                Enable if this ticket requires shipping
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
                        name={`tickets.${index}.show_remaining_count`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Show Remaining Count</FormLabel>
                              <FormDescription>
                                Display how many tickets are left
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
                    </div>
                  </CardContent>
                </Card>
              ))}

              {fields.length > 0 && (
                <Button type="submit">Save Tickets</Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
