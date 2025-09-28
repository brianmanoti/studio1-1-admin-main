/**
 * Cookie utility functions using manual document.cookie approach
 * Replaces js-cookie dependency for better consistency
 */

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue
  }
  return undefined
}

/**
 * Set a cookie with proper security attributes
 */
export function setCookie(
  name: string,
  value: string,
  maxAge: number = DEFAULT_MAX_AGE
): void {
  if (typeof document === 'undefined') return

  // ✅ Always secure in production
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''

  // ✅ Use SameSite=Lax for app-only cookies (or None for cross-site APIs)
  const sameSite = '; SameSite=Lax'

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}${sameSite}${secureFlag}`
}