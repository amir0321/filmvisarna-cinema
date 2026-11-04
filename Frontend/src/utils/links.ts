export function getMovieUrl(movieId: number): string {
  return `/filmer/${movieId}`
}

// Opens the details page with the trailer playing
export function getMovieTrailerUrl(movieId: number): string {
  return `${getMovieUrl(movieId)}?trailer=1`
}

export function getBookingUrl(screeningId: number): string {
  return `/boka/${screeningId}`
}

export function isAuthPath(pathname: string): boolean {
  return /^\/(login|logga-in|register|registrera|skapa-konto|reset-password|verify-email)(?:\/|$)/i.test(pathname)
}

// Validate decoded paths too: routers and servers may normalize encoded separators.
export function getSafeRedirectPath(target: string | null | undefined, fallback = '/'): string {
  const safeFallback = fallback === '/' ? '/' : getSafeRedirectPath(fallback)
  if (!target || /\s/.test(target)) return safeFallback
  let decoded = target
  try {
    for (let i = 0; i < 5; i++) {
      const hasUnsafeCharacter = Array.from(decoded).some(character =>
        character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
      if (!decoded.startsWith('/') || decoded.startsWith('//') || hasUnsafeCharacter) return safeFallback
      const url = new URL(decoded, 'https://filmvisarna.invalid')
      if (url.origin !== 'https://filmvisarna.invalid' || url.pathname.startsWith('//') || isAuthPath(url.pathname)) return safeFallback
      const next = decodeURIComponent(decoded)
      if (next === decoded) return target
      decoded = next
    }
  } catch { return safeFallback }
  return safeFallback
}
