# Notification Badge Feature Documentation

## Overview
This feature adds a visual notification badge (red bubble) on the user avatar icon in the main navigation menu to indicate when users have unread messages.

## Visual Description

### Badge Appearance
- **Position**: Top-right corner of the user avatar (-1px from top, -1px from right)
- **Shape**: Circular badge (5x5 units)
- **Color**: Red background (#EF4444) with white text
- **Animation**: Pulsing red ring effect (animate-ping) for attention
- **Content**: Shows unread message count (displays "99+" if count exceeds 99)

### Placement
The notification badge appears on:
1. **Desktop Navigation**: User avatar in the top-right corner of the main navigation bar
2. **Mobile Navigation**: User avatar in the mobile menu

### Behavior
- **Visibility**: Only shows when `unreadMessagesCount > 0`
- **Real-time Updates**: Updates immediately via WebSocket when new messages arrive
- **Reset**: Count updates when messages are read in the conversations view

## Technical Implementation

### Backend (Ruby on Rails)
- `User#unread_messages_count`: Calculates total unread messages across all conversations
- API endpoint `/api/v1/me.json` includes `unread_messages_count` field
- Real-time broadcasts via `NotificationsChannel` when new messages arrive

### Frontend (React)
- `NotificationBadge` component: Reusable badge with animation
- `useAuthStore`: Zustand store managing unread message count state
- `UserMenu` component: Subscribes to NotificationsChannel for real-time updates
- Methods: `incrementUnreadMessagesCount`, `decrementUnreadMessagesCount`, `updateUnreadMessagesCount`

### Styling (Tailwind CSS)
```css
/* Badge container */
.absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center

/* Pulsing animation */
.animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75

/* Badge content */
.relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-semibold
```

## User Experience

### Scenario 1: No Unread Messages
- User avatar displays normally
- No badge visible

### Scenario 2: Unread Messages Present
- Red pulsing badge appears on avatar
- Badge shows count (e.g., "3" or "99+")
- User can click avatar to access dropdown menu
- Clicking "Messages" navigates to `/conversations`

### Scenario 3: Real-time Update
- User receives new message while browsing
- Badge count increments automatically (no refresh needed)
- Pulsing animation draws attention to new notification

### Scenario 4: Reading Messages
- User visits conversations page and reads messages
- Badge count decrements or disappears when all messages read

## Browser Compatibility
- Modern browsers supporting CSS animations
- Tailwind CSS classes for responsive design
- Works on mobile and desktop viewports

## Accessibility
- Badge provides visual indication only
- Screen readers can access message count through dropdown menu items
- Color contrast meets WCAG standards (white text on red background)

## Future Enhancements
- Sound notification option
- Desktop browser notifications
- Customizable badge colors in user settings
- Badge on browser tab title
