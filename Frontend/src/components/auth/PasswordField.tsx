import { useState, type ReactNode } from 'react'

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = Math.max(1, [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length)
  const label = ['Svagt', 'Okej', 'Starkt', 'Mycket starkt'][score - 1]
  return <div className={`fv-password-strength strength-${score}`}>
    <div className="fv-strength-segments" aria-hidden="true">
      {[1, 2, 3, 4].map(segment => <span key={segment} className={segment <= score ? 'filled' : ''} />)}
    </div>
    <small>Lösenordsstyrka: {label}</small>
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

export default function PasswordField({ value, onChange, error, registering, action, id = 'password', label = 'Lösenord', showStrength = registering }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return <div className="fv-auth-field">
    <div className="fv-auth-label-row"><label htmlFor={id}>{label}</label>{action}</div>
    <div className="fv-password-input">
      <input id={id} name={id} type={visible ? 'text' : 'password'} value={value}
        onChange={event => onChange(event.target.value)} required
        autoComplete={registering ? 'new-password' : 'current-password'}
        autoCapitalize="none" spellCheck={false} aria-invalid={Boolean(error)}
        aria-describedby={[error ? `${id}-error` : '', showStrength ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined} />
      <button type="button" className="fv-password-toggle" aria-label={visible ? 'Dölj lösenord' : 'Visa lösenord'}
        aria-pressed={visible} onClick={() => setVisible(!visible)}>
        <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
      </button>
    </div>
    {error && <p className="fv-auth-field-error" id={`${id}-error`}>{error}</p>}
    {showStrength && <><small id={`${id}-hint`}>Använd 8–72 tecken, högst 72 byte. Å, ä, ö och andra specialtecken kan ta mer plats. Välj gärna en lång, unik lösenfras.</small><PasswordStrength password={value} /></>}
  </div>
}
