const formatDateSafely = (dateString) => {
  if (!dateString) return new Date().toISOString()
  try {
    const date = parseISO(dateString)
    return isValid(date) ? date.toISOString() : new Date().toISOString()
  } catch (error) {
    console.error('Error formatting date:', error)
    return new Date().toISOString()
  }
}


export { formatDateSafely }