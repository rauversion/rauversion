import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
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
import { Loader2, Download, Search } from "lucide-react"
import {Badge} from "@/components/ui/badge"


const searchSchema = z.object({
  query: z.string(),
  status: z.enum(["all", "attending", "cancelled", "pending"]).default("all"),
})

const attendeeStatuses = {
  attending: { label: "Attending", color: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
  pending: { label: "Pending", color: "bg-yellow-500" },
}

export default function Attendees() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = React.useState("")

  const {
    items: attendees,
    loading,
    lastElementRef,
    resetList
  } = useInfiniteScroll(`/events/${slug}/event_attendees.json${searchParams}`)

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
      status: "all"
    }
  })

  const onSubmit = (data) => {
    const params = new URLSearchParams()
    if (data.query) params.append("query", data.query)
    if (data.status !== "all") params.append("status", data.status)
    const queryString = params.toString()
    setSearchParams(queryString ? `?${queryString}` : "")
    resetList()
  }

  const updateAttendeeStatus = async (attendeeId, status) => {
    try {
      const response = await fetch(`/events/${slug}/event_attendees/${attendeeId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          status
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        resetList()
        toast({
          title: "Success",
          description: "Attendee status updated successfully",
        })
      }
    } catch (error) {
      console.error('Error updating attendee:', error)
      toast({
        title: "Error",
        description: "Could not update attendee status",
        variant: "destructive",
      })
    }
  }

  const removeAttendee = async (attendeeId) => {
    if (!confirm("Are you sure you want to remove this attendee?")) return

    try {
      const response = await fetch(`/events/${slug}/event_attendees/${attendeeId}.json`, {
        method: 'DELETE'
      })

      if (response.ok) {
        resetList()
        toast({
          title: "Success",
          description: "Attendee removed successfully",
        })
      }
    } catch (error) {
      console.error('Error removing attendee:', error)
      toast({
        title: "Error",
        description: "Could not remove attendee",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Event Attendees</h2>
          <p className="text-sm text-muted-foreground">
            Manage your event attendees and their status
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = `/events/${slug}/attendees/export.csv`}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4 mb-6">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="Search by name or email"
                      className="pl-8"
                      {...field}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="attending">Attending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <Button type="submit">Search</Button>
        </form>
      </Form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendees.map((item, index) => (
              <TableRow 
                key={item.id} 
                ref={index === attendees.length - 1 ? lastElementRef : null}
              >
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-medium">{item.user.name}</p>
                      <p className="text-sm text-gray-500">{item.user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.event_ticket.title}</div>
                  <div className="text-sm text-gray-500">
                    {item.event_ticket.currency} {item.event_ticket.price}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary"
                    className={attendeeStatuses[item.state]?.color || 'bg-gray-500'}
                  >
                    {attendeeStatuses[item.state]?.label || item.state}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(item.created_at), 'PPP')}
                </TableCell>
                <TableCell>
                  {item.checked_in_at && (
                    <Badge variant="success">
                      Checked in at {format(new Date(item.checked_in_at), 'PPp')}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
