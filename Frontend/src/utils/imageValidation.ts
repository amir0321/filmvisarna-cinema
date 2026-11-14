export function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const url = value.trim()
  if (!url || url.length > 2048 || url.includes('\\')) return false
  for (const character of url) {
    const code = character.charCodeAt(0)
    if (code < 32 || code === 127) return false
  }
  if (url.startsWith('/uploads/')) {
    return !url.includes('..') && /^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(url)
  }
  try {
    const parsed = new URL(url)
    return /^https?:\/\//i.test(url)
      && ['http:', 'https:'].includes(parsed.protocol)
      && !parsed.username && !parsed.password
  } catch {
    return false
  }
}

export function validateImageFile(file: File): string | undefined {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    return 'Endast bildfiler (JPEG, PNG, WebP, GIF) är tillåtna.'
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Bildfilen är för stor. Maximal filstorlek är 5 MB.'
  }
}
