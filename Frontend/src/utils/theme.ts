export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'fv-theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Theme switching still works when storage is unavailable or full.
  }
}
