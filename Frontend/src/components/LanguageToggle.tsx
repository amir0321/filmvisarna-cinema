import { useLocale, useTranslation } from '../context/LocaleContext'

interface LanguageToggleProps {
  variant?: 'icon' | 'menu'
}

export default function LanguageToggle({ variant = 'icon' }: LanguageToggleProps) {
  const { locale, toggleLocale } = useLocale()
  const { t } = useTranslation()
  const nextLocale = locale === 'sv' ? 'en' : 'sv'
  const label = t(locale === 'sv' ? 'language.switchToEnglish' : 'language.switchToSwedish')

  return (
    <button
      type="button"
      className={variant === 'menu' ? 'drawer-language-btn' : 'nav-language-btn'}
      onClick={toggleLocale}
      aria-label={label}
      title={label}
    >
      <i className="bi bi-translate" aria-hidden="true" />
      <span lang={nextLocale}>{variant === 'menu' ? (nextLocale === 'en' ? 'English' : 'Svenska') : nextLocale.toUpperCase()}</span>
    </button>
  )
}
