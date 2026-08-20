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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import I18n from "@/stores/locales"

const formSchema = z.object({
  rating: z.string().min(1, I18n.t("service_bookings.feedback_form.errors.rating_required")),
  feedback: z.string()
    .min(1, I18n.t("service_bookings.feedback_form.errors.feedback_required"))
    .max(1000, I18n.t("service_bookings.feedback_form.errors.feedback_too_long")),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  bookingId: number
  onSuccess: () => void
}

export function FeedbackForm({ bookingId, onSuccess }: Props) {
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: "",
      feedback: "",
    },
  })

  const feedbackMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await patch(`/service_bookings/${bookingId}`, {
        body: { service_booking: data },
        responseKind: "json",
      })
    },
    onSuccess: () => {
      toast({
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.update.feedback_submitted"),
      })
      onSuccess()
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.update.feedback_error"),
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    feedbackMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t("service_bookings.feedback_form.rating")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={I18n.t("service_bookings.feedback_form.rating_placeholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {I18n.t("service_bookings.feedback_form.stars", { count: rating })}
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
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t("service_bookings.feedback_form.feedback")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={I18n.t("service_bookings.feedback_form.feedback_placeholder")}
                  className="min-h-[100px]"
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
          disabled={feedbackMutation.isPending}
        >
          {feedbackMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {I18n.t("service_bookings.feedback_form.submit")}
        </Button>
      </form>
    </Form>
  )
}
