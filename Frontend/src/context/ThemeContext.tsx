import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readTheme, saveTheme, type Theme } from '../utils/theme'

export type { Theme } from '../utils/theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const toggleTheme = useCallback(() => {
    setTheme(previous => previous === 'dark' ? 'light' : 'dark')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.dataset.bsTheme = theme
    root.style.colorScheme = theme
    saveTheme(theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}

// Keep the public theme API together in the requested context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
