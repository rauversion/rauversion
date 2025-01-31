export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // If dates are on the same day
  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`
  }

  // Different days
  return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleDateString()} ${end.toLocaleTimeString()}`
}
