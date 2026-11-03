import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { extractAuthFieldErrors, login, register, type AuthField, type AuthFieldErrors } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { getSafeRedirectPath } from '../../utils/links'
import { validateAuth } from '../../utils/authValidation'
import AuthCard from './AuthCard'
import PasswordField from './PasswordField'
import ForgotPasswordModal from './ForgotPasswordModal'

export default function AuthForm({ registering = false }: { registering?: boolean }) {
  const { setSession } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()
  const redirect = getSafeRedirectPath(params.get('redirect'))
  const state: unknown = location.state
  const initialEmail = state && typeof state === 'object' && 'email' in state && typeof state.email === 'string' ? state.email : ''
  const [values, setValues] = useState({ email: initialEmail, password: '', firstName: '', lastName: '' })
  const [errors, setErrors] = useState<AuthFieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [conflictEmail, setConflictEmail] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const cooldownUntil = useRef(0)
  const failures = useRef(0)
  const request = useRef<AbortController | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const alert = useRef<HTMLDivElement>(null)
  const coolingDown = seconds > 0

  useEffect(() => () => { request.current?.abort() }, [])
  useEffect(() => {
    if (!coolingDown) return
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil.current - Date.now()) / 1000))
      setSeconds(remaining)
      if (!remaining) failures.current = 0
    }, 250)
    return () => window.clearInterval(timer)
  }, [coolingDown])

  function update(field: AuthField, value: string) {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => ({ ...previous, [field]: undefined }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.current || Date.now() < cooldownUntil.current) return
    const fieldErrors = validateAuth(values, registering)
    setErrors(fieldErrors)
    setServerError('')
    setConflictEmail(null)
    const firstError = (['firstName', 'lastName', 'email', 'password'] as const).find(field => fieldErrors[field])
    if (firstError) {
      form.current?.querySelector<HTMLInputElement>(`[name="${firstError}"]`)?.focus()
      return
    }
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    try {
      const payload = { ...values, email: values.email.trim(), firstName: values.firstName.trim(), lastName: values.lastName.trim() }
      const response = await (registering ? register(payload, controller.signal) : login({ email: payload.email, password: payload.password }, controller.signal))
      if (controller.signal.aborted) return
      setValues(previous => ({ ...previous, password: '' }))
      setSession(response)
    } catch (error) {
      if (controller.signal.aborted) return
      const fields = extractAuthFieldErrors(error)
      setErrors(fields)
      if (!registering && error instanceof ApiError && error.status === 401) {
        setServerError('Fel e-postadress eller lösenord. Kontrollera dina uppgifter och försök igen.')
        failures.current += 1
        if (failures.current >= 5) {
          cooldownUntil.current = Date.now() + 30_000
          setSeconds(30)
        }
      } else if (registering && error instanceof ApiError && error.status === 409) {
        setErrors({ email: 'Det finns redan ett konto med denna e-postadress.' })
        setServerError('Det finns redan ett konto med denna e-postadress.')
        setConflictEmail(values.email.trim())
      } else if (error instanceof ApiError && error.status < 500) {
        setServerError(error.status === 400 && Object.keys(fields).length ? 'Kontrollera de markerade fälten och försök igen.' : error.message)
      } else {
        setServerError('Kunde inte nå servern just nu. Kontrollera din anslutning och försök igen.')
      }
      // Wait for the alert to render before moving focus to the response.
      window.requestAnimationFrame(() => { if (!controller.signal.aborted) alert.current?.focus() })
    } finally {
      if (!controller.signal.aborted) {
        request.current = null
        setPending(false)
      }
    }
  }

  function textField(field: Exclude<AuthField, 'password'>, label: string, autoComplete: string) {
    return <div className="fv-auth-field">
      <label htmlFor={field}>{label}</label>
      <input id={field} name={field} type={field === 'email' ? 'email' : 'text'} autoComplete={autoComplete}
        autoCapitalize={field === 'email' ? 'none' : 'words'} spellCheck={false} required
        value={values[field]} onChange={event => update(field, event.target.value)}
        aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} />
      {errors[field] && <p className="fv-auth-field-error" id={`${field}-error`}>{errors[field]}</p>}
    </div>
  }

  return <AuthCard registering={registering} redirect={redirect}>
    <form ref={form} className="fv-auth-form" onSubmit={submit} noValidate aria-busy={pending}>
      {serverError && <div className="fv-auth-error" role="alert" tabIndex={-1} ref={alert}>
        <p>{serverError}</p>
        {conflictEmail && <Link to={`/logga-in${redirect === '/' ? '' : `?redirect=${encodeURIComponent(redirect)}`}`} state={{ email: conflictEmail }}>Logga in med denna e-post</Link>}
      </div>}
      <fieldset disabled={pending}>
        {registering && <div className="fv-auth-names">{textField('firstName', 'Förnamn', 'given-name')}{textField('lastName', 'Efternamn', 'family-name')}</div>}
        {textField('email', 'E-postadress', 'email')}
        <PasswordField value={values.password} onChange={value => update('password', value)} error={errors.password} registering={registering}
          action={!registering && <button type="button" className="fv-auth-link" onClick={() => setForgotOpen(true)}>Glömt lösenord?</button>} />
        <button className="fv-auth-submit" type="submit" disabled={pending || seconds > 0}>
          {pending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {pending ? registering ? 'Skapar konto...' : 'Loggar in...' : registering ? 'Skapa konto' : 'Logga in'}
        </button>
      </fieldset>
      <div role="status" aria-live="polite" aria-atomic="true">
        {seconds > 0 && <p className="fv-auth-cooldown">För många misslyckade försök. Försök igen om {seconds} sekunder.</p>}
      </div>
    </form>
    <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
  </AuthCard>
}
