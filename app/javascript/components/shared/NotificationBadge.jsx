import React from 'react';

/**
 * NotificationBadge component displays a notification count badge
 * @param {number} count - The number to display in the badge
 * @param {boolean} show - Whether to show the badge (default: true when count > 0)
 */
export function NotificationBadge({ count, show = null }) {
  const shouldShow = show !== null ? show : count > 0;
  
  if (!shouldShow) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-semibold items-center justify-center">
        {count > 99 ? '99+' : count}
      </span>
    </span>
  );
}

export default NotificationBadge;
