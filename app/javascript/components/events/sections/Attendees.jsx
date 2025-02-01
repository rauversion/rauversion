import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Download,
  MoreVertical, 
  Search,
  UserMinus,
  Mail,
  CheckCircle,
  XCircle
} from "lucide-react"

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
  const [attendees, setAttendees] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  })

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
      status: "all"
    }
  })

  const loadAttendees = async (page = 1, filters = {}) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page,
        ...filters
      })
      const response = await fetch(`/events/${slug}/attendees.json?${queryParams}`)
      const data = await response.json()
      setAttendees(data.attendees)
      setPagination({
        currentPage: data.current_page,
        totalPages: data.total_pages,
        totalCount: data.total_count
      })
    } catch (error) {
      console.error('Error loading attendees:', error)
      toast({
        title: "Error",
        description: "Could not load attendees",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadAttendees()
  }, [slug])

  const onSubmit = async (data) => {
    loadAttendees(1, data)
  }

  const handlePageChange = (page) => {
    loadAttendees(page, form.getValues())
  }

  const updateAttendeeStatus = async (attendeeId, status) => {
    try {
      const response = await put(`/events/${slug}/attendees/${attendeeId}.json`, {
        body: JSON.stringify({
          status
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        loadAttendees(pagination.currentPage, form.getValues())
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
      const response = await fetch(`/events/${slug}/attendees/${attendeeId}.json`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadAttendees(pagination.currentPage, form.getValues())
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

  const exportAttendees = async () => {
    try {
      const response = await fetch(`/events/${slug}/attendees/export.csv`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}-attendees-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting attendees:', error)
      toast({
        title: "Error",
        description: "Could not export attendees",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Event Attendees</CardTitle>
              <CardDescription>
                Manage your event attendees and their status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={exportAttendees}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="flex gap-4 mb-6"
            >
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
                {attendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={attendee.avatar_url} />
                          <AvatarFallback>{attendee.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{attendee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {attendee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{attendee.ticket_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {attendee.ticket_price}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={attendeeStatuses[attendee.status].color}
                      >
                        {attendeeStatuses[attendee.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(attendee.created_at), 'PPp')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateAttendeeStatus(attendee.id, 'attending')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Attending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateAttendeeStatus(attendee.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark as Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.location.href = `mailto:${attendee.email}`}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => removeAttendee(attendee.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Attendee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {attendees.length} of {pagination.totalCount} attendees
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
