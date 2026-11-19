import { useTranslation } from '../context/LocaleContext'
import { useTheme } from '../context/ThemeContext'

interface ThemeToggleProps {
  variant?: 'icon' | 'menu'
}

export default function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const label = t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')
  const icon = theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'

  return (
    <button
      type="button"
      className={variant === 'menu' ? 'drawer-theme-btn' : 'nav-theme-btn'}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <i className={`bi ${icon}`} aria-hidden="true" />
      {variant === 'menu' ? <span>{label}</span> : null}
    </button>
  )
}
