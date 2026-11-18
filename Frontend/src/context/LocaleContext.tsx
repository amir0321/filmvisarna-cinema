import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createTranslator } from '../i18n'
import { readLocale, saveLocale, type Locale } from '../utils/locale'

export type { Locale } from '../utils/locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale)
  const setLocale = useCallback((next: Locale) => {
    // Persist before rendering so utilities using readLocale see the new choice.
    saveLocale(next)
    document.documentElement.lang = next
    setLocaleState(next)
  }, [])
  const toggleLocale = useCallback(() => {
    setLocale(locale === 'sv' ? 'en' : 'sv')
  }, [locale, setLocale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, setLocale, toggleLocale])
  return <LocaleContext value={value}>{children}</LocaleContext>
}

// Keep the public locale API together in the requested context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (context === undefined) throw new Error('useLocale must be used within a LocaleProvider')
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  const { locale } = useLocale()
  const t = useMemo(() => createTranslator(locale), [locale])
  return { t, locale }
}
