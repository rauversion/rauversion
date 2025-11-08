# Hidden Tickets Flow Diagram

## Regular Ticket Purchase Flow (Existing)

```
User visits event page
         ↓
Clicks "Get Tickets" button
         ↓
Purchase dialog opens
         ↓
Shows all available tickets (filtered by available_tickets method)
         ↓
User selects quantity and purchases
         ↓
Redirected to payment/success page
```

## Hidden Ticket Purchase Flow (New)

```
Event organizer creates hidden ticket
         ↓
Generates secret link: event.secret_ticket_url(ticket)
         ↓
Shares link with specific users via email/message
         ↓
User clicks secret link
         ↓
Event page loads with ticket_token in URL
  (e.g., /events/my-event?ticket_token=eyJfcmFpbHMi...)
         ↓
Purchase dialog AUTOMATICALLY opens
         ↓
Shows ONLY the hidden ticket (single ticket)
         ↓
User purchases the ticket
         ↓
Redirected to payment/success page
```

## Technical Flow

### 1. Link Generation (Ruby)
```
Event Model
  ├─ secret_ticket_url(ticket)
  │    └─ ticket.signed_id(expires_in: 30.days, purpose: :secret_purchase)
  │         └─ Generates cryptographically signed token
  └─ Returns full URL with token parameter
```

### 2. URL Access (Frontend)
```
User clicks link with token
         ↓
Show.jsx loads
  ├─ Reads ticket_token from URL params
  ├─ Fetches event data
  └─ Auto-opens purchase dialog with token
         ↓
PurchaseDialog renders
  └─ Passes ticketToken to PurchaseForm
         ↓
PurchaseForm fetches tickets
  └─ API call: /events/:id/event_purchases/new.json?ticket_token=...
```

### 3. Backend Processing (Rails)
```
EventPurchasesController#new
         ↓
Receives ticket_token parameter
         ↓
IF token present:
  ├─ EventTicket.find_signed(token, purpose: :secret_purchase)
  ├─ Verify ticket belongs to event
  └─ Return [single_ticket]
ELSE:
  └─ Return event.available_tickets (all visible tickets)
         ↓
Render new.json.jbuilder
         ↓
Return tickets JSON to frontend
```

### 4. Frontend Display
```
PurchaseForm receives tickets
         ↓
Renders ticket selection UI
  ├─ IF 1 ticket: Show only that ticket
  └─ IF multiple tickets: Show all with selection
         ↓
User completes purchase
         ↓
Same purchase flow as regular tickets
```

## Security Flow

```
Token Generation
  ├─ Rails GlobalID signs the ticket ID
  ├─ Adds expiration (30 days)
  ├─ Adds purpose (:secret_purchase)
  └─ Returns encrypted token
         ↓
Token Validation
  ├─ Decrypt token with Rails secret
  ├─ Check expiration (fail if > 30 days)
  ├─ Verify purpose matches
  ├─ Load ticket from database
  ├─ Verify ticket belongs to event
  └─ Return ticket or empty array
         ↓
Invalid Token Handling
  ├─ Expired: Return empty array
  ├─ Tampered: Return empty array
  ├─ Wrong event: Return empty array
  └─ User sees "No tickets available" message
```

## State Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    HIDDEN TICKET                        │
│                                                          │
│  State: settings = { hidden: true }                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  NOT visible in regular purchase flow          │    │
│  │  NOT returned by event.available_tickets       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│              ↓ Generate Secret Link ↓                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  SIGNED TOKEN CREATED                          │    │
│  │  - Expires in 30 days                          │    │
│  │  - Cryptographically signed                    │    │
│  │  - Purpose: :secret_purchase                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│              ↓ User visits link ↓                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  TOKEN VALIDATED                               │    │
│  │  - Signature checked                           │    │
│  │  - Expiration checked                          │    │
│  │  - Event ownership verified                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│              ↓ Valid token ↓                            │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  TICKET VISIBLE TO USER                        │    │
│  │  - Shown in purchase dialog                    │    │
│  │  - Only this ticket visible                    │    │
│  │  - Can be purchased                            │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   REGULAR TICKET                        │
│                                                          │
│  State: settings = {} or { hidden: false }              │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  VISIBLE in regular purchase flow              │    │
│  │  RETURNED by event.available_tickets           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│              ↓ User visits event page ↓                 │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  TICKET VISIBLE TO ALL USERS                   │    │
│  │  - Shown when "Get Tickets" clicked            │    │
│  │  - Listed with other tickets                   │    │
│  │  - Can be purchased by anyone                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌─────────────┐
│  Show.jsx   │
│             │
│ - Reads URL │      ┌──────────────────┐
│ - Gets      │─────▶│ PurchaseDialog   │
│   token     │      │                  │
└─────────────┘      │ - Receives token │
                     │ - Renders dialog │
                     └─────────┬────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │  PurchaseForm    │
                     │                  │
                     │ - Uses token in  │
                     │   API call       │
                     │ - Displays       │
                     │   tickets        │
                     └─────────┬────────┘
                               │
                               ▼
                     ┌──────────────────────────┐
                     │ EventPurchasesController │
                     │                          │
                     │ - Validates token        │
                     │ - Returns filtered       │
                     │   tickets                │
                     └──────────────────────────┘
```

## Error Handling

```
Token Validation Error
         ↓
┌─────────────────┐
│ Invalid Token?  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Expired   Tampered/Wrong Event
    │         │
    └────┬────┘
         ▼
Return empty tickets array
         ↓
Frontend displays:
"No tickets available"
         ↓
User sees empty purchase form
(graceful degradation)
```

## Database Schema (No Changes Required)

```sql
-- EventTicket already has settings jsonb column
-- Just need to set: settings = { hidden: true }

event_tickets
├── id
├── title
├── price
├── qty
├── selling_start
├── selling_end
├── settings  ← jsonb column (already exists)
│   └── { "hidden": true }  ← Just set this flag
└── event_id
```

## Backward Compatibility

```
┌──────────────────────────────────────────┐
│  Existing Code (No Changes Required)    │
│                                          │
│  - Regular tickets still work normally  │
│  - available_tickets filters out hidden │
│  - Purchase flow unchanged              │
│  - No migration needed                  │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  New Feature (Additive Only)            │
│                                          │
│  + ticket_token parameter handling      │
│  + secret_ticket_url method             │
│  + Auto-open dialog on token present    │
│  + No breaking changes                  │
└──────────────────────────────────────────┘
```
