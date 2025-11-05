# Notification Badge Visual Guide

## Feature Overview
This document provides a visual representation of the notification badge feature added to Rauversion.

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Bar                                             │
│                                                             │
│  [Logo] [Menu Items...]              [Search] [Cart] [🌙]  │
│                                                       ┌─────┤
│                                                       │  👤 │
│                                                       │  🔴3│
│                                                       └─────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Badge States

#### State 1: No Unread Messages
```
┌─────┐
│ 👤  │  ← User avatar (no badge)
│     │
└─────┘
```

#### State 2: Has Unread Messages (1-99)
```
┌─────┐
│ 👤  │  ← User avatar with badge
│  🔴5│  ← Red pulsing badge showing count
└─────┘
```

#### State 3: Many Unread Messages (100+)
```
┌─────┐
│ 👤  │  ← User avatar with badge
│ 🔴99+  ← Badge shows "99+" for counts over 99
└─────┘
```

## Badge Design Specifications

### Visual Properties
```css
Badge Container:
├─ Position: absolute top-right of avatar (-1px, -1px)
├─ Size: 20px × 20px (h-5 w-5)
├─ Shape: Circle (rounded-full)
└─ Z-index: Above avatar

Background Animation (Pulsing Ring):
├─ Color: Red 400 (#F87171)
├─ Opacity: 75%
├─ Animation: animate-ping (Tailwind CSS)
└─ Effect: Expands and fades continuously

Badge Content:
├─ Background: Red 500 (#EF4444)
├─ Text Color: White
├─ Font Size: xs (0.75rem)
├─ Font Weight: Semibold (600)
└─ Content: Number or "99+"
```

### Animation Behavior

The badge features a pulsing animation that draws user attention:

```
Frame 1:  ⭕ (Small ring)
Frame 2:   ⭕ (Medium ring, fading)
Frame 3:    ⭕ (Large ring, more faded)
Frame 4:  ⭕ (Cycle repeats)
         🔴5 (Static badge with count)
```

## User Interaction Flow

### Scenario: Receiving a New Message

```
Step 1: User browsing site
┌──────────────────────┐
│ Navigation Bar       │
│              [👤]    │ ← No badge
└──────────────────────┘

Step 2: Another user sends message
        (WebSocket broadcast)
            ↓
┌──────────────────────┐
│ Navigation Bar       │
│            [👤🔴1]   │ ← Badge appears with pulse animation
└──────────────────────┘

Step 3: User notices badge and clicks avatar
┌──────────────────────┐
│ Navigation Bar       │
│            [👤🔴1]   │ ← Dropdown menu opens
│          ┌─────────┐ │
│          │ Profile │ │
│          │ Settings│ │
│          │Messages │ │ ← User can click to view messages
│          │ Logout  │ │
│          └─────────┘ │
└──────────────────────┘

Step 4: User reads message in conversations view
        (Badge count updates or disappears)
            ↓
┌──────────────────────┐
│ Navigation Bar       │
│              [👤]    │ ← Badge removed when all messages read
└──────────────────────┘
```

## Real-time Update Mechanism

```
┌─────────────────┐
│  User A Browser │
│                 │
│  [👤🔴3]        │
└────────┬────────┘
         │
         │ WebSocket Connection (ActionCable)
         │
         ↓
┌─────────────────────────┐
│   Rails Server          │
│                         │
│  NotificationsChannel   │
│  ↓                      │
│  Broadcast new_message  │
└────────┬────────────────┘
         │
         │ Real-time push
         │
         ↓
┌─────────────────┐
│  User A Browser │
│                 │
│  [👤🔴4]        │ ← Count incremented automatically
└─────────────────┘
```

## Mobile View

The badge also appears on mobile navigation:

```
Mobile Menu (Hamburger collapsed):
┌────────────────────┐
│ [☰] [Logo]  [👤🔴2]│
└────────────────────┘

Mobile Menu (Expanded):
┌────────────────────┐
│ [×] Rauversion     │
├────────────────────┤
│ Magazine           │
│ Music              │
│ Events             │
│ Store              │
├────────────────────┤
│ Profile [👤🔴2]    │ ← Badge also on avatar in expanded menu
│ Messages           │
│ Settings           │
└────────────────────┘
```

## Accessibility Considerations

1. **Visual Indicator**: Badge provides clear visual feedback
2. **Color Contrast**: White text on red background meets WCAG standards
3. **Animation**: Pulsing draws attention without being distracting
4. **Screen Readers**: Count accessible via dropdown menu text
5. **Keyboard Navigation**: Badge doesn't interfere with keyboard focus

## Browser Compatibility

- ✅ Chrome/Edge (80+)
- ✅ Firefox (75+)
- ✅ Safari (13+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Badge only renders when count > 0 (conditional rendering)
- WebSocket subscription only active when user is logged in
- CSS animations use GPU acceleration (Tailwind animate-ping)
- No polling - efficient real-time updates via WebSocket

## Future Enhancement Ideas

1. Badge color variations for different notification types
2. Sound notification option
3. Browser tab title badge (e.g., "(3) Rauversion")
4. Desktop push notifications
5. Customizable badge position/style in user settings
