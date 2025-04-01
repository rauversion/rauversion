import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { post, patch } from "@rails/request.js"
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
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  scheduled_date: z.string().min(1, "Date is required"),
  scheduled_time: z.string().min(1, "Time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  meeting_link: z.string().optional(),
  meeting_location: z.string().optional(),
  provider_notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  bookingId: number
  onSuccess: () => void
}

export function ScheduleForm({ bookingId, onSuccess }: Props) {
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduled_date: "",
      scheduled_time: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meeting_link: "",
      meeting_location: "",
      provider_notes: "",
    },
  })

  const scheduleMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await patch(`/service_bookings/${bookingId}/schedule`, {
        body: { service_booking: data },
        responseKind: "json",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service scheduled successfully",
      })
      onSuccess()
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule service",
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    scheduleMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meeting_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting Link (for online services)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meeting_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting Location (for in-person services)</FormLabel>
              <FormControl>
                <Input placeholder="Address or location details" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes or instructions for the service..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={scheduleMutation.isPending}
        >
          {scheduleMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Schedule Service
        </Button>
      </form>
    </Form>
  )
}
