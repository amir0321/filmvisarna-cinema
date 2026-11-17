export type Locale = 'sv' | 'en'

export const LOCALE_STORAGE_KEY = 'fv-locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'sv' || value === 'en'
}

export function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : 'sv'
  } catch {
    return 'sv'
  }
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Language switching still works when storage is unavailable or full.
  }
}

export function getIntlLocale(locale: Locale = readLocale()): 'sv-SE' | 'en-GB' {
  return locale === 'en' ? 'en-GB' : 'sv-SE'
}
