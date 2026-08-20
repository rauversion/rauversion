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
import I18n from "@/stores/locales"

const formSchema = z.object({
  scheduled_date: z.string().min(1, I18n.t("service_bookings.schedule_modal.errors.date_required")),
  scheduled_time: z.string().min(1, I18n.t("service_bookings.schedule_modal.errors.time_required")),
  timezone: z.string().min(1, I18n.t("service_bookings.schedule_modal.errors.timezone_required")),
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
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.schedule.success"),
      })
      onSuccess()
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.schedule.error"),
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
              <FormLabel>{I18n.t("service_bookings.schedule_modal.date")}</FormLabel>
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
              <FormLabel>{I18n.t("service_bookings.schedule_modal.time")}</FormLabel>
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
              <FormLabel>{I18n.t("service_bookings.schedule_modal.timezone")}</FormLabel>
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
              <FormLabel>{I18n.t("service_bookings.schedule_modal.meeting_link")}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={I18n.t("service_bookings.schedule_modal.meeting_link_placeholder")}
                  {...field}
                />
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
              <FormLabel>{I18n.t("service_bookings.schedule_modal.meeting_location")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={I18n.t("service_bookings.schedule_modal.meeting_location_placeholder")}
                  {...field}
                />
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
              <FormLabel>{I18n.t("service_bookings.schedule_modal.provider_notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={I18n.t("service_bookings.schedule_modal.provider_notes_placeholder")}
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
          {I18n.t("service_bookings.schedule_modal.schedule_button")}
        </Button>
      </form>
    </Form>
  )
}
