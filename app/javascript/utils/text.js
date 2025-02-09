export function truncate(text, length = 100, omission = '...') {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length - omission.length) + omission
}
