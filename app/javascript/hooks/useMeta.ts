import { useMemo } from 'react'

/**
 * Hook to read content from meta tags in the document head
 * @param name The name attribute of the meta tag to read
 * @returns The content attribute value of the meta tag, or null if not found
 */
export function useMeta(name: string): string | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null
    
    const meta = document.querySelector(`meta[name="${name}"]`)
    return meta ? meta.getAttribute('content') : null
  }, [name])
}

// Example usage:
// const googleMapsKey = useMeta('google-maps-api-key')
// const environment = useMeta('rauversion-environment')
// const currentUserId = useMeta('current-user-id')
