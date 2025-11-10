import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { get, post } from "@rails/request.js"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Download, Search, UserPlus, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const searchSchema = z.object({
  query: z.string(),
  status: z.enum(["all", "pending", "paid", "refunded"]).default("all"),
})

const invitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  ticket_id: z.string().min(1, "Please select a ticket"),
})

const attendeeStatuses = {
  paid: { label: I18n.t('events.edit.attendees.status.attending'), color: "bg-green-500" },
  pending: { label: I18n.t('events.edit.attendees.status.pending'), color: "bg-yellow-500" },
  refunded: { label: "Refunded", color: "bg-red-500" },
}

export default function Attendees() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = React.useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false)
  const [tickets, setTickets] = React.useState([])
  const [isSubmittingInvite, setIsSubmittingInvite] = React.useState(false)
  const [refundingItemId, setRefundingItemId] = React.useState(null)
  const [refundConfirmItem, setRefundConfirmItem] = React.useState(null)

  const {
    items: attendees,
    loading,
    lastElementRef,
    resetList,
    fetchItems
  } = useInfiniteScroll(`/events/${slug}/event_attendees.json${searchParams}`)

  window.resetList = resetList // For debugging purposes
  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
      status: "all"
    }
  })

  const inviteForm = useForm({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      ticket_id: ""
    }
  })

  // Load tickets for the invitation dialog
  React.useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await get(`/events/${slug}/event_attendees/tickets.json`)
        if (response.ok) {
          const data = await response.json
          setTickets(data.collection || [])
        }
      } catch (error) {
        console.error('Error loading tickets:', error)
      }
    }
    loadTickets()
  }, [slug])

  const onSubmit = (data) => {
    const params = new URLSearchParams()
    if (data.query) params.append("query", data.query)
    if (data.status !== "all") params.append("status", data.status)
    const queryString = params.toString()
    setSearchParams(queryString ? `?${queryString}` : "")
    fetchItems()
  }

  const handleExportCSV = async () => {
    try {
      const response = await get(`/events/${slug}/event_attendees/export_csv.json`)
      if (response.ok) {
        toast({
          title: "Export Requested",
          description: "The attendees list will be sent to your email shortly.",
        })
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "Error",
        description: "Failed to export attendees list.",
        variant: "destructive",
      })
    }
  }

  const onSubmitInvite = async (data) => {
    setIsSubmittingInvite(true)
    try {
      const response = await post(`/events/${slug}/event_attendees/create_invitation.json`, {
        body: JSON.stringify({
          email: data.email,
          ticket_id: data.ticket_id
        }),
        contentType: 'application/json'
      })

      if (response.ok) {
        toast({
          title: "Invitation Sent",
          description: "The invitation has been created successfully.",
        })
        setIsInviteDialogOpen(false)
        inviteForm.reset()
        fetchItems()
      } else {
        const errorData = await response.json
        toast({
          title: "Error",
          description: errorData.errors?.join(', ') || "Failed to send invitation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  const handleRefund = async (item) => {
    setRefundingItemId(item.id)
    try {
      const response = await post(`/events/${slug}/event_attendees/${item.id}/refund.json`, {
        contentType: 'application/json'
      })

      if (response.ok) {
        toast({
          title: "Refund Processed",
          description: "The ticket has been refunded successfully.",
        })
        setRefundConfirmItem(null)
        fetchItems()
      } else {
        const errorData = await response.json
        toast({
          title: "Error",
          description: errorData.errors?.join(', ') || "Failed to process refund.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      toast({
        title: "Error",
        description: "Failed to process refund.",
        variant: "destructive",
      })
    } finally {
      setRefundingItemId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{I18n.t('events.edit.attendees.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {I18n.t('events.edit.attendees.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Event Invitation</DialogTitle>
                <DialogDescription>
                  Invite someone to this event by email. If they don't have an account, one will be created for them.
                </DialogDescription>
              </DialogHeader>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="ticket_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Ticket</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a ticket" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tickets.map((ticket) => (
                              <SelectItem key={ticket.id} value={String(ticket.id)}>
                                {ticket.title} - ${ticket.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingInvite}>
                      {isSubmittingInvite ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            {I18n.t('events.edit.attendees.export_csv')}
          </Button>
        </div>
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
                      placeholder={I18n.t('events.edit.attendees.search.placeholder')}
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
                      <SelectValue placeholder={I18n.t('events.edit.attendees.search.filter_status')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">{I18n.t('events.edit.attendees.search.all_statuses')}</SelectItem>
                    <SelectItem value="paid">{I18n.t('events.edit.attendees.status.attending')}</SelectItem>
                    <SelectItem value="pending">{I18n.t('events.edit.attendees.status.pending')}</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <Button type="submit">{I18n.t('events.edit.attendees.search.button')}</Button>
        </form>
      </Form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{I18n.t('events.edit.attendees.table.attendee')}</TableHead>
              <TableHead>{I18n.t('events.edit.attendees.table.ticket')}</TableHead>
              <TableHead>{I18n.t('events.edit.attendees.table.status')}</TableHead>
              <TableHead>{I18n.t('events.edit.attendees.table.purchase_date')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
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
                      {I18n.t('events.edit.attendees.status.checked_in', { time: format(new Date(item.checked_in_at), 'PPp') })}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.state === 'paid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRefundConfirmItem(item)}
                      disabled={refundingItemId === item.id}
                    >
                      {refundingItemId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Refund
                        </>
                      )}
                    </Button>
                  )}
                  {item.state === 'refunded' && (
                    <span className="text-sm text-muted-foreground">Refunded</span>
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

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={!!refundConfirmItem} onOpenChange={(open) => !open && setRefundConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this ticket? This action will:
              <ul className="list-disc list-inside mt-2">
                <li>Process a refund for {refundConfirmItem?.event_ticket?.currency} {refundConfirmItem?.event_ticket?.price}</li>
                <li>Return the ticket to available inventory</li>
                <li>Mark the purchase as refunded</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRefund(refundConfirmItem)}>
              Confirm Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
