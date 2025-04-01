import React from 'react'
import { useParams } from 'react-router-dom'
import EventTicketModal from './EventTicketModal'

export default function EventTicketShow() {
  const { slug, id } = useParams()

  return (
    <div className="min-h-screen bg-background">
      <EventTicketModal
        ticketId={id}
        selectedTicket={{
          purchased_item: {
            event: {
              slug
            }
          }
        }}
        open={true}
        onOpenChange={() => {
          window.history.back()
        }}
      />
    </div>
  )
}
