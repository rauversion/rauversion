# Hidden Tickets Feature - Complete Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Feature Overview](#feature-overview)
3. [Documentation](#documentation)
4. [Implementation Details](#implementation-details)
5. [Security](#security)
6. [Testing](#testing)

## 🚀 Quick Start

### Creating a Hidden Ticket
```ruby
# In Rails console or your application code
event = Event.find_by(slug: 'my-event')

hidden_ticket = event.event_tickets.create!(
  title: "VIP Backstage Pass",
  price: 150.00,
  qty: 25,
  selling_start: Time.current,
  selling_end: 1.month.from_now,
  short_description: "Exclusive backstage access",
  settings: { hidden: true }  # This makes it hidden!
)

# Generate the secret link
secret_url = event.secret_ticket_url(hidden_ticket)
puts secret_url
# => "https://yourapp.com/events/my-event?ticket_token=eyJfcmFpbHMi..."
```

### Sharing the Link
Send the generated `secret_url` to your users via:
- Email
- Private message
- SMS
- Private Discord/Slack channels
- Newsletters to VIP subscribers

### User Experience
1. User clicks the secret link
2. Event page loads with the special ticket token in URL
3. Purchase dialog automatically opens
4. Only the hidden ticket is visible
5. User completes purchase normally

## 📖 Feature Overview

Hidden tickets are tickets that are not visible in the regular event purchase flow. They can only be accessed through a special signed URL that:

- ✅ Expires automatically after 30 days
- ✅ Is cryptographically signed (cannot be forged)
- ✅ Grants access to a specific hidden ticket
- ✅ Validates the ticket belongs to the event
- ✅ Auto-opens the purchase dialog

## 📚 Documentation

This feature includes comprehensive documentation:

### 1. [HIDDEN_TICKETS.md](./HIDDEN_TICKETS.md)
**Technical Documentation**
- Implementation details
- Security considerations
- API reference
- Troubleshooting guide

### 2. [HIDDEN_TICKETS_EXAMPLE.md](./HIDDEN_TICKETS_EXAMPLE.md)
**Usage Examples**
- Real-world scenarios
- Step-by-step guides
- Code samples
- Best practices
- VIP pre-sales example
- Backstage pass example
- Press credentials example
- Sponsor allocation example

### 3. [HIDDEN_TICKETS_FLOW.md](./HIDDEN_TICKETS_FLOW.md)
**Architecture & Flow Diagrams**
- Visual flow diagrams
- State diagrams
- Component interactions
- Error handling
- Security flow
- Backward compatibility

## 🔧 Implementation Details

### Backend Changes

#### EventPurchasesController
```ruby
# app/controllers/event_purchases_controller.rb

def new
  @event = Event.friendly.find(params[:event_id])
  
  # New: Handle ticket_token parameter
  if params[:ticket_token].present?
    begin
      ticket = EventTicket.find_signed(params[:ticket_token], purpose: :secret_purchase)
      if ticket && ticket.event_id == @event.id
        @tickets = [ticket]  # Only return this ticket
      else
        @tickets = []
      end
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      @tickets = []
    end
  else
    @tickets = @event.available_tickets(Time.zone.now)  # Normal flow
  end
  
  # ... rest of the method
end
```

#### Event Model
```ruby
# app/models/event.rb

def secret_ticket_url(ticket)
  Rails.application.routes.url_helpers.new_event_event_purchase_url(
    self,
    ticket_token: ticket.signed_id(expires_in: 30.days, purpose: :secret_purchase)
  )
end
```

### Frontend Changes

#### PurchaseForm Component
```typescript
// app/javascript/components/events/PurchaseForm.tsx

interface PurchaseFormProps {
  eventId: string
  ticketToken?: string  // New optional prop
}

export default function PurchaseForm({ eventId, ticketToken }: PurchaseFormProps) {
  // Build URL with token if present
  const url = ticketToken 
    ? `/events/${eventId}/event_purchases/new.json?ticket_token=${encodeURIComponent(ticketToken)}`
    : `/events/${eventId}/event_purchases/new.json`
    
  const response = await get(url)
  // ...
}
```

#### Show Component
```javascript
// app/javascript/components/events/Show.jsx

export default function EventShow() {
  const { slug } = useParams()
  
  // Read ticket_token from URL
  const searchParams = new URLSearchParams(window.location.search)
  const ticketToken = searchParams.get('ticket_token')
  
  useEffect(() => {
    // ... fetch event
    
    // Auto-open dialog if token present
    if (ticketToken) {
      setDialogOpen(true)
    }
  }, [slug, ticketToken])
  
  // Pass token to dialog
  return (
    <PurchaseDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      eventId={event.slug}
      ticketToken={ticketToken}
    />
  )
}
```

## 🔒 Security

### What Makes This Secure?

1. **Cryptographic Signing**
   - Uses Rails' `signed_id` (based on `ActiveSupport::MessageVerifier`)
   - Tokens cannot be forged without the app's secret key
   - Any tampering invalidates the token

2. **Automatic Expiration**
   - Tokens expire after 30 days
   - Expired tokens are rejected gracefully
   - No manual cleanup required

3. **Purpose Parameter**
   - Tokens are bound to `:secret_purchase` purpose
   - Prevents reuse in different contexts
   - Extra layer of security

4. **Event Ownership Verification**
   - Backend verifies ticket belongs to the requested event
   - Prevents cross-event ticket access
   - Graceful failure if mismatch

5. **Graceful Error Handling**
   - Invalid tokens return empty ticket array
   - No error messages reveal security details
   - User sees "no tickets available"

### Security Audit Results
✅ CodeQL Security Scan: **0 Alerts**
✅ No SQL injection vulnerabilities
✅ No XSS vulnerabilities
✅ Proper token validation
✅ Secure URL generation

## 🧪 Testing

### Manual Testing Steps

1. **Create a hidden ticket**
   ```ruby
   ticket = event.event_tickets.create!(
     title: "Test Hidden",
     price: 10,
     qty: 5,
     settings: { hidden: true }
   )
   ```

2. **Generate link**
   ```ruby
   url = event.secret_ticket_url(ticket)
   ```

3. **Test regular event page**
   - Visit `/events/your-event`
   - Click "Get Tickets"
   - Hidden ticket should NOT appear

4. **Test secret link**
   - Visit the generated URL
   - Purchase dialog should auto-open
   - Only hidden ticket should appear
   - Should be purchasable

5. **Test expired/invalid tokens**
   - Modify token in URL
   - Should see no tickets available
   - Should not crash

### Automated Testing

```ruby
# spec/controllers/event_purchases_controller_spec.rb
describe "GET #new" do
  context "with valid ticket_token" do
    it "returns only the specified ticket" do
      ticket = create(:event_ticket, event: event, settings: { hidden: true })
      token = ticket.signed_id(expires_in: 30.days, purpose: :secret_purchase)
      
      get :new, params: { event_id: event.slug, ticket_token: token }
      
      expect(assigns(:tickets)).to eq([ticket])
    end
  end
  
  context "with invalid ticket_token" do
    it "returns empty array" do
      get :new, params: { event_id: event.slug, ticket_token: "invalid" }
      
      expect(assigns(:tickets)).to eq([])
    end
  end
  
  context "without ticket_token" do
    it "returns available tickets" do
      ticket1 = create(:event_ticket, event: event)
      ticket2 = create(:event_ticket, event: event, settings: { hidden: true })
      
      get :new, params: { event_id: event.slug }
      
      expect(assigns(:tickets)).to include(ticket1)
      expect(assigns(:tickets)).not_to include(ticket2)
    end
  end
end
```

### Build Verification
```bash
# JavaScript build
yarn build
# ✅ Builds successfully without errors

# TypeScript check
yarn tsc --noEmit
# ✅ No type errors

# Security scan
# ✅ CodeQL: 0 alerts
```

## 📊 Use Cases

### 1. VIP Pre-sales
Give early access to select customers before public sale
- Higher price point
- Limited quantity
- Time-limited

### 2. Backstage Passes
Free tickets for performers and crew
- Zero price
- Behind-the-scenes access
- Restricted list

### 3. Press Credentials
Media and press access
- Complimentary
- Requires verification
- Special instructions

### 4. Sponsor Allocations
Complimentary tickets for event sponsors
- Free or discounted
- Multiple tickets per link
- Special seating

### 5. Early Bird Sales
Secret early bird pricing
- Lower price
- Limited availability
- Creates urgency

### 6. Private Invitations
Exclusive event access
- Invitation-only
- Custom pricing
- Personalized experience

## 🔄 Backward Compatibility

✅ **100% Backward Compatible**

- Regular tickets work exactly as before
- No database migrations required
- No breaking changes
- Existing purchase flow unchanged
- Optional feature - only activates when needed

## 🎯 Benefits

1. **Flexibility**: Different prices and quantities for different audiences
2. **Security**: Cryptographically secure, no guessing
3. **Simplicity**: Uses existing purchase flow
4. **Tracking**: All purchases tracked the same way
5. **Scarcity**: Creates urgency with limited access
6. **Personalization**: Different links for different segments
7. **No Code Changes**: Organizers just set `hidden: true`

## 📞 Support

For questions or issues:
1. Check the documentation files in this directory
2. Review the flow diagrams in HIDDEN_TICKETS_FLOW.md
3. See examples in HIDDEN_TICKETS_EXAMPLE.md
4. Check technical details in HIDDEN_TICKETS.md

## 🚢 Deployment Notes

No special deployment steps required:
- ✅ No database migrations
- ✅ No environment variables
- ✅ No new dependencies
- ✅ Assets build successfully
- ✅ Security scan passed

Just deploy as normal!

## 📝 License

This feature is part of the Rauversion project and follows the same license.
