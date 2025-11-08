# Hidden Tickets Feature

## Overview

The hidden tickets feature allows event organizers to create tickets that are not publicly visible in the regular purchase flow. These tickets can only be accessed through a special secret link.

## How It Works

### 1. Creating a Hidden Ticket

When creating or editing an event ticket, set the `hidden` setting to `true` in the ticket's settings:

```ruby
ticket = event.event_tickets.create!(
  title: "VIP Backstage Pass",
  price: 100,
  qty: 10,
  selling_start: Time.current,
  selling_end: 1.month.from_now,
  short_description: "Exclusive backstage access",
  settings: { hidden: true }
)
```

### 2. Generating the Secret Link

Use the `secret_ticket_url` method on the event to generate a secure link:

```ruby
secret_url = event.secret_ticket_url(ticket)
# => https://example.com/events/my-event?ticket_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6...
```

This generates a signed URL that:
- Expires after 30 days
- Is cryptographically signed to prevent tampering
- Includes a purpose parameter for additional security

### 3. How Users Access Hidden Tickets

When a user visits the secret link:

1. The event page loads normally
2. The purchase dialog automatically opens
3. Only the specific hidden ticket is shown in the purchase form
4. The user can purchase only that ticket

### 4. Technical Implementation

#### Backend (Rails)

**EventPurchasesController**:
- Accepts `ticket_token` parameter in the `new` action
- Uses `EventTicket.find_signed` to securely retrieve the ticket
- Verifies the ticket belongs to the requested event
- Returns only that ticket in the response

**Event Model**:
- `secret_ticket_url(ticket)` method generates the secure link
- Uses Rails' `signed_id` with 30-day expiration

#### Frontend (React)

**Show.jsx**:
- Reads `ticket_token` from URL query parameters
- Automatically opens the purchase dialog when token is present
- Passes token to PurchaseDialog component

**PurchaseForm.tsx**:
- Accepts `ticketToken` prop
- Appends token to API request when fetching tickets
- Only displays tickets returned by the API (just the hidden ticket)

## Security Considerations

- Tokens expire after 30 days
- Tokens are cryptographically signed and cannot be forged
- Purpose parameter prevents token reuse in different contexts
- Ticket ownership is verified against the event
- Invalid signatures are caught and handled gracefully

## Use Cases

- Early bird sales to specific groups
- Private pre-sales for VIP customers
- Limited invitations to exclusive events
- Backstage passes for performers and crew
- Press and media tickets
- Sponsor and partner allocations

## Example Workflow

1. Event organizer creates a hidden ticket
2. Organizer generates secret links using Rails console or admin interface:
   ```ruby
   event = Event.find_by(slug: 'my-event')
   ticket = event.event_tickets.find_by(title: 'VIP Pass')
   puts event.secret_ticket_url(ticket)
   ```
3. Organizer shares the link via email, private message, etc.
4. Recipients click the link and are taken directly to the purchase page
5. They see only the hidden ticket and can complete their purchase

## Limitations

- One ticket per link (cannot share multiple hidden tickets in one link)
- Links expire after 30 days
- Requires user authentication to purchase
