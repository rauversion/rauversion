# Hidden Tickets - UI Guide for Event Organizers

## Overview
This guide explains how to create hidden tickets and generate secret links directly from the event management interface.

## Step-by-Step Guide

### 1. Access the Tickets Section
1. Navigate to your event's edit page
2. Click on the "Tickets" tab/section
3. You'll see a list of your existing tickets or an option to create new ones

### 2. Create or Edit a Hidden Ticket
1. Click "Add Ticket" button to create a new ticket, or edit an existing one
2. Fill in the ticket details:
   - **Title**: Name of your ticket (e.g., "VIP Backstage Pass")
   - **Description**: Brief description
   - **Price**: Ticket price
   - **Quantity**: Number of tickets available
   - **Sales Period**: When the ticket can be purchased

### 3. Mark the Ticket as Hidden
1. Scroll down to the "Display Options" section
2. Find the **"Hidden"** toggle switch
3. Turn it **ON** (enabled)
4. This will hide the ticket from the public event page

### 4. Save Your Changes
1. Click the **"Save Tickets"** button at the bottom of the form
2. Wait for the success confirmation
3. The ticket is now saved in the database

### 5. Generate the Secret Link
After saving, a new section appears below the "Hidden" toggle:

```
┌─────────────────────────────────────────────────┐
│  🔗 Secret Link                                  │
│  Generate a secret link to share this hidden    │
│  ticket with specific people                    │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  📋 Generate & Copy Link                │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

1. Click the **"Generate & Copy Link"** button
2. The system will:
   - Generate a secure, signed URL
   - Automatically copy it to your clipboard
   - Show a "✓ Copied!" confirmation
   - Display a success toast notification

### 6. Share the Link
1. Open your email client, messaging app, or wherever you want to share
2. Paste the link (Ctrl+V / Cmd+V)
3. Send it to the people you want to have access

Example link format:
```
https://yourapp.com/events/your-event-name?ticket_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6...
```

## What Recipients See

When someone clicks your secret link:
1. They're taken to your event page
2. The purchase dialog **automatically opens**
3. They see **only the hidden ticket** (not other tickets)
4. They can complete their purchase normally

## Important Notes

### Requirements
- ✅ Ticket must be marked as "Hidden" (toggle ON)
- ✅ Ticket must be saved first (has an ID)
- ✅ You must be the event owner

### Link Properties
- 🔒 **Secure**: Links are cryptographically signed
- ⏰ **Temporary**: Links expire after 30 days
- 🔐 **Authorized**: Only event owners can generate links
- ♻️ **Reusable**: Same link can be used multiple times (within 30 days)

### Best Practices

#### DO:
✅ Save the ticket before generating the link
✅ Generate a new link each time you want to share
✅ Test the link yourself before mass distribution
✅ Set appropriate selling_start and selling_end dates
✅ Monitor ticket sales through your dashboard

#### DON'T:
❌ Share links publicly on social media
❌ Send expired tickets (check selling dates)
❌ Forget to set the ticket quantity
❌ Share the same link after 30 days (generate a new one)

## Common Use Cases

### VIP Pre-Sale
```
1. Create hidden ticket: "VIP Early Bird - $150"
2. Set selling_start: Now
3. Set selling_end: 2 weeks from now
4. Generate link
5. Email to VIP list
```

### Backstage Passes
```
1. Create hidden ticket: "Backstage Pass - $0"
2. Set quantity: Number of performers + crew
3. Generate link
4. Share with each performer individually
```

### Press Credentials
```
1. Create hidden ticket: "Press Pass - $0"
2. Add after_purchase_message: "Please bring photo ID"
3. Generate link
4. Share with verified media contacts
```

### Sponsor Tickets
```
1. Create hidden ticket: "Sponsor VIP Package - $0"
2. Set max_tickets_per_order: 2 (sponsor + guest)
3. Generate link
4. Share with each sponsor
```

## Troubleshooting

### "Button doesn't appear"
- Make sure the "Hidden" toggle is ON
- Save the ticket first (click "Save Tickets")
- Refresh the page if needed

### "Error generating link"
- Verify you're the event owner
- Make sure the ticket was saved successfully
- Check browser console for specific error messages

### "Link doesn't work"
- Check if the link expired (30 days)
- Verify the link was copied completely
- Make sure the ticket's selling period is active

### "Wrong ticket shows up"
- Each link is for a specific ticket
- Generate separate links for different hidden tickets
- Don't modify the ticket_token parameter in the URL

## Support

For technical details, see:
- [HIDDEN_TICKETS_README.md](./HIDDEN_TICKETS_README.md) - Complete technical guide
- [HIDDEN_TICKETS.md](./HIDDEN_TICKETS.md) - Implementation details
- [HIDDEN_TICKETS_EXAMPLE.md](./HIDDEN_TICKETS_EXAMPLE.md) - Code examples
- [HIDDEN_TICKETS_FLOW.md](./HIDDEN_TICKETS_FLOW.md) - Architecture diagrams

## Quick Reference

| Action | Location | Result |
|--------|----------|--------|
| Mark as hidden | Tickets form → Hidden toggle | Ticket hidden from public |
| Save ticket | Bottom of form | Ticket stored in database |
| Generate link | Below Hidden toggle | Link copied to clipboard |
| Share link | Email/Message/etc | Recipients can purchase |

## Security Notice

🔒 Secret links are secure but should be treated as access credentials:
- Only share with intended recipients
- Don't post publicly
- Generate new links if one is compromised
- Links expire automatically after 30 days
- Monitor purchases through your dashboard
