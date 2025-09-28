const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : undefined
}

export function setCookie(
  name: string,
  value: string,
  maxAge: number = DEFAULT_MAX_AGE
): void {
  if (typeof document === 'undefined') return

  // ✅ encode value for safety
  const encodedValue = encodeURIComponent(value)
  const isSecure = window.location.protocol === 'https:'
  const secure = isSecure ? '; Secure' : ''
  const sameSite = isSecure ? '; SameSite=None' : '; SameSite=Lax'

  document.cookie = `${name}=${encodedValue}; path=/; max-age=${maxAge}${sameSite}${secure}`
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return
  const isSecure = window.location.protocol === 'https:'
  const secure = isSecure ? '; Secure' : ''
  const sameSite = isSecure ? '; SameSite=None' : '; SameSite=Lax'
  document.cookie = `${name}=; path=/; max-age=0${sameSite}${secure}`
}
