import { useTheme } from '../context/ThemeContext'

interface ThemeToggleProps {
  variant?: 'icon' | 'menu'
}

export default function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema'
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
