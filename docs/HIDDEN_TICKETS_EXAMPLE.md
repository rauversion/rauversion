# Hidden Tickets - Usage Example

## Scenario: VIP Pre-sale Event

An event organizer wants to offer an early VIP ticket sale to select customers before the general public sale opens.

### Step 1: Create the Event and Tickets

```ruby
# Create the event
event = Event.create!(
  title: "Summer Music Festival 2024",
  description: "The biggest music festival of the year",
  event_start: 3.months.from_now,
  event_ends: 3.months.from_now + 3.days,
  state: "published",
  user: organizer
)

# Create regular tickets (visible to everyone)
regular_ticket = event.event_tickets.create!(
  title: "General Admission",
  price: 50.00,
  qty: 1000,
  selling_start: 1.month.from_now,  # Starts later
  selling_end: 3.months.from_now,
  short_description: "General admission to all festival days",
  settings: {}  # Not hidden
)

# Create hidden VIP ticket (only accessible via secret link)
vip_ticket = event.event_tickets.create!(
  title: "VIP Early Bird",
  price: 150.00,
  qty: 50,
  selling_start: Time.current,  # Available now
  selling_end: 2.weeks.from_now,  # Limited time offer
  short_description: "VIP access with backstage passes and meet & greet",
  settings: { 
    hidden: true  # This makes it hidden from regular purchase flow
  }
)
```

### Step 2: Generate Secret Links

```ruby
# Generate the secret link for the VIP ticket
secret_url = event.secret_ticket_url(vip_ticket)

puts secret_url
# => "https://myapp.com/events/summer-music-festival-2024?ticket_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6..."
```

### Step 3: Share with Select Customers

The organizer can now:
- Email the link to VIP customers
- Share via private message
- Post in a private Discord/Slack channel
- Include in a newsletter to subscribers

Example email:

```
Subject: Exclusive VIP Pre-sale for Summer Music Festival 2024

Dear Valued Customer,

As a thank you for your continued support, we're offering you exclusive 
early access to VIP tickets for our Summer Music Festival 2024!

🎟️ Click here to purchase your VIP Early Bird ticket:
https://myapp.com/events/summer-music-festival-2024?ticket_token=eyJfcmFpbHMiO...

This offer is only available for the next 2 weeks and limited to 50 tickets.

VIP Benefits:
- All-access pass to 3 days of festival
- Backstage passes
- Meet & greet with performers
- VIP lounge access
- Priority parking

Don't miss out!

Best regards,
Festival Team
```

### Step 4: What the Customer Sees

When a customer clicks the secret link:

1. **Event page loads** - They see the normal event information
2. **Purchase dialog auto-opens** - The purchase form automatically appears
3. **Only VIP ticket shown** - They only see the "VIP Early Bird" ticket in the purchase form
4. **Complete purchase** - They can purchase the VIP ticket normally

### Step 5: Public Sale Opens Later

After the 2-week VIP pre-sale period:

1. The VIP hidden ticket expires (selling_end reached)
2. Regular tickets become available (selling_start reached)
3. Public customers visiting the event page see only regular tickets
4. VIP link holders who didn't purchase won't see any tickets (expired)

## Additional Use Cases

### Backstage Passes for Performers

```ruby
backstage_pass = event.event_tickets.create!(
  title: "Artist + Crew Backstage Pass",
  price: 0.00,  # Free for performers
  qty: 100,
  selling_start: Time.current,
  selling_end: event.event_start,
  short_description: "All-access backstage pass",
  settings: { hidden: true }
)

# Generate links and send to each performer
performers.each do |performer|
  link = event.secret_ticket_url(backstage_pass)
  PerformerMailer.backstage_pass(performer, link).deliver_later
end
```

### Press and Media Credentials

```ruby
press_pass = event.event_tickets.create!(
  title: "Press Credentials",
  price: 0.00,
  qty: 25,
  selling_start: Time.current,
  selling_end: event.event_start,
  short_description: "Media and press access",
  settings: { 
    hidden: true,
    after_purchase_message: "Please bring photo ID and press credentials"
  }
)

# Share with verified press contacts
```

### Sponsor Allocation

```ruby
sponsor_ticket = event.event_tickets.create!(
  title: "Sponsor VIP Package",
  price: 0.00,  # Free for sponsors
  qty: 20,
  selling_start: Time.current,
  selling_end: event.event_start,
  short_description: "Complimentary VIP package for event sponsors",
  settings: { 
    hidden: true,
    max_tickets_per_order: 2  # Each sponsor can bring a guest
  }
)
```

## Benefits of This Approach

1. **Security**: Links cannot be forged or tampered with
2. **Expiration**: Links automatically expire after 30 days
3. **Flexibility**: Each hidden ticket can have its own price, quantity, and date range
4. **Tracking**: Standard purchase flow means all purchases are tracked the same way
5. **No special UI needed**: Uses existing purchase flow with automatic filtering
6. **Scarcity**: Create urgency with limited quantities and time windows
7. **Personalization**: Different links can be sent to different customer segments

## Monitoring Sales

```ruby
# Check VIP ticket sales
vip_sales = vip_ticket.purchased_items.where(state: "paid")
puts "VIP tickets sold: #{vip_sales.count} / #{vip_ticket.qty}"

# Revenue from VIP tickets
vip_revenue = vip_sales.sum(:price)
puts "VIP revenue: $#{vip_revenue}"

# Who purchased VIP tickets
vip_customers = vip_sales.includes(:purchase).map { |pi| pi.purchase.user }
```

## Best Practices

1. **Set appropriate expiration dates** on tickets (selling_end)
2. **Limit quantities** for exclusive offers
3. **Test the link** before sharing widely
4. **Track link usage** if needed (can add custom tracking parameters)
5. **Have a backup plan** if links leak (can create new ticket with new link)
6. **Clear communication** about what customers are getting
7. **Monitor inventory** to avoid overselling

## Troubleshooting

### Link doesn't work
- Check if ticket selling_end has passed
- Verify ticket belongs to the correct event
- Check if link was fully copied (tokens can be long)

### Wrong ticket shows up
- Verify the ticket_token parameter is correct
- Check browser URL to ensure token is present

### Multiple hidden tickets
- Currently, one link = one ticket
- To offer multiple options, send multiple links or create a visible ticket group
