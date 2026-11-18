import { translateApiError } from '../../i18n/mappers'
import { useTranslation } from '../../context/LocaleContext'
import { useState, type ReactNode } from 'react'

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation()
  if (!password) return null
  const score = Math.max(1, [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length)
  const label = [t('auth.strengthWeak'), t('auth.strengthOkay'), t('auth.strengthStrong'), t('auth.strengthVeryStrong')][score - 1]
  return <div className={`fv-password-strength strength-${score}`}>
    <div className="fv-strength-segments" aria-hidden="true">
      {[1, 2, 3, 4].map(segment => <span key={segment} className={segment <= score ? 'filled' : ''} />)}
    </div>
    <small>{t('auth.strength', { strength: label })}</small>
  </div>
}

interface PasswordFieldProps {
  id?: string
  label?: string
  showStrength?: boolean
  value: string
  onChange: (value: string) => void
  error?: string
  registering?: boolean
  action?: ReactNode
}

export default function PasswordField({ value, onChange, error, registering, action, id = 'password', label, showStrength = registering }: PasswordFieldProps) {
  const { t, locale } = useTranslation()
  const [visible, setVisible] = useState(false)
  return <div className="fv-auth-field">
    <div className="fv-auth-label-row"><label htmlFor={id}>{label ?? t('auth.password')}</label>{action}</div>
    <div className="fv-password-input">
      <input id={id} name={id} type={visible ? 'text' : 'password'} value={value}
        onChange={event => onChange(event.target.value)} required
        autoComplete={registering ? 'new-password' : 'current-password'}
        autoCapitalize="none" spellCheck={false} aria-invalid={Boolean(error)}
        aria-describedby={[error ? `${id}-error` : '', showStrength ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined} />
      <button type="button" className="fv-password-toggle" aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible} onClick={() => setVisible(!visible)}>
        <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
      </button>
    </div>
    {error && <p className="fv-auth-field-error" id={`${id}-error`}>{translateApiError(error, locale)}</p>}
    {showStrength && <><small id={`${id}-hint`}>{t('auth.passwordHint')}</small><PasswordStrength password={value} /></>}
  </div>
}
