const STORAGE_KEY = 'sign-in-return-path'
const AUTH_PATH = /^\/(?:users\/(?:sign_in|sign_up|sign_out|password|auth|confirmation|invitation)|forgot-password|sign_in)(?:\/|\.|$)/

export function safeSignInReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return null

  try {
    const url = new URL(value, 'https://return-path.invalid')
    if (url.origin !== 'https://return-path.invalid' || AUTH_PATH.test(url.pathname)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function locationPath(location) {
  if (typeof location === 'string') return location
  if (!location?.pathname) return null
  return `${location.pathname}${location.search || ''}${location.hash || ''}`
}

export function rememberSignInReturnPath(location, storage) {
  const path = safeSignInReturnPath(locationPath(location))
  if (!path) return

  try {
    (storage ?? window.sessionStorage).setItem(STORAGE_KEY, path)
  } catch {
    // Router state still supports returning when browser storage is unavailable.
  }
}

export function signInReturnPath(location, storage) {
  const explicitPath = safeSignInReturnPath(new URLSearchParams(location?.search).get('return_to'))
  const routerPath = safeSignInReturnPath(locationPath(location?.state?.from))
  if (explicitPath || routerPath) return explicitPath || routerPath

  try {
    return safeSignInReturnPath((storage ?? window.sessionStorage).getItem(STORAGE_KEY)) || '/'
  } catch {
    return '/'
  }
}

export function clearSignInReturnPath(storage) {
  try {
    (storage ?? window.sessionStorage).removeItem(STORAGE_KEY)
  } catch {
    // Clearing optional browser storage must not interrupt a successful sign-in.
  }
}
