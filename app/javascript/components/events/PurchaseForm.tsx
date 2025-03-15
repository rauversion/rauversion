import * as React from "react"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { get, post } from "@rails/request.js"

interface Ticket {
  id: string
  title: string
  price: number
  short_description: string
  quantity: number
}

interface PurchaseFormProps {
  eventId: string
}

export default function PurchaseForm({ eventId }: PurchaseFormProps) {
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await get(`/events/${eventId}/event_purchases/new.json`)
        const data = await response.json
        setTickets(data.tickets)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tickets. Please try again.",
        })
      }
    }

    fetchTickets()
  }, [eventId])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await post(`/events/${eventId}/event_purchases`, {
        body: JSON.stringify({
          tickets: Object.entries(data).map(([id, quantity]) => ({
            id,
            quantity: parseInt(quantity as string, 10),
          })),
        }),
      })
      
      const result = await response.json
      
      // Redirect to payment URL if provided
      if (result.payment_url) {
        window.location.href = result.payment_url
      } else {
        navigate(`/events/${eventId}/event_purchases/${result.id}`)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process purchase. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Purchase Tickets</CardTitle>
        <CardDescription>Select the number of tickets you want to purchase</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <Label htmlFor={ticket.id}>{ticket.title}</Label>
                  <p className="text-sm text-gray-500">{ticket.short_description}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${ticket.price}</div>
                  <div className="text-sm text-gray-500">
                    {ticket.quantity} available
                  </div>
                </div>
              </div>
              <Input
                type="number"
                id={ticket.id}
                {...register(ticket.id, {
                  min: { value: 0, message: "Quantity cannot be negative" },
                  max: {
                    value: ticket.quantity,
                    message: `Maximum ${ticket.quantity} tickets available`,
                  },
                })}
                defaultValue={0}
                min={0}
                max={ticket.quantity}
              />
              {errors[ticket.id] && (
                <p className="text-sm text-red-500">
                  {errors[ticket.id]?.message as string}
                </p>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Purchase Tickets"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
