import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
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
  status: z.enum(["all", "attending", "cancelled", "pending", 'paid']).default("all"),
})

const attendeeStatuses = {
  paid: { label: I18n.t('events.edit.attendees.status.attending'), color: "bg-green-500" },
  attending: { label: I18n.t('events.edit.attendees.status.attending'), color: "bg-green-500" },
  cancelled: { label: I18n.t('events.edit.attendees.status.cancelled'), color: "bg-red-500" },
  pending: { label: I18n.t('events.edit.attendees.status.pending'), color: "bg-yellow-500" },
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
          title: I18n.t("events.edit.attendees.messages.success_title"),
          description: I18n.t('events.edit.attendees.messages.update_success'),
        })
      }
    } catch (error) {
      console.error('Error updating attendee:', error)
      toast({
        title: I18n.t("events.edit.attendees.messages.error_title"),
        description: I18n.t('events.edit.attendees.messages.update_error'),
        variant: "destructive",
      })
    }
  }

  const removeAttendee = async (attendeeId) => {
    if (!confirm(I18n.t('events.edit.attendees.messages.remove_confirm'))) return

    try {
      const response = await fetch(`/events/${slug}/event_attendees/${attendeeId}.json`, {
        method: 'DELETE'
      })

      if (response.ok) {
        resetList()
        toast({
          title: I18n.t("events.edit.attendees.messages.success_title"),
          description: I18n.t('events.edit.attendees.messages.remove_success'),
        })
      }
    } catch (error) {
      console.error('Error removing attendee:', error)
      toast({
        title: I18n.t("events.edit.attendees.messages.error_title"),
        description: I18n.t('events.edit.attendees.messages.remove_error'),
        variant: "destructive",
      })
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
        <Button
          variant="outline"
          onClick={() => window.location.href = `/events/${slug}/attendees/export.csv`}
        >
          <Download className="h-4 w-4 mr-2" />
          {I18n.t('events.edit.attendees.export_csv')}
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
                    <SelectItem value="attending">{I18n.t('events.edit.attendees.status.attending')}</SelectItem>
                    <SelectItem value="cancelled">{I18n.t('events.edit.attendees.status.cancelled')}</SelectItem>
                    <SelectItem value="pending">{I18n.t('events.edit.attendees.status.pending')}</SelectItem>
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
