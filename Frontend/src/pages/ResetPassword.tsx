import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { resetPassword } from '../api/auth'
import { ApiError } from '../api/client'
import AuthActionCard from '../components/auth/AuthActionCard'
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal'
import PasswordField from '../components/auth/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { useAuthActionToken } from '../hooks/useAuthActionToken'
import { validateNewPassword } from '../utils/authValidation'

export default function ResetPassword() {
  const token = useAuthActionToken()
  const { user, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [passwordError, setPasswordError] = useState<string>()
  const [confirmationError, setConfirmationError] = useState<string>()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const request = useRef<AbortController | null>(null)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!token || request.current) return
    const invalid = validateNewPassword(password)
    const mismatch = password !== confirmation ? 'Lösenorden matchar inte.' : undefined
    setPasswordError(invalid)
    setConfirmationError(mismatch)
    if (invalid || mismatch) {
      form.current?.querySelector<HTMLInputElement>(invalid ? '#password' : '#password-confirm')?.focus()
      return
    }
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const response = await resetPassword(token, password, controller.signal)
      if (controller.signal.aborted) return
      setPassword('')
      setConfirmation('')
      if (user?.email === response.email) await logout()
      setMessage(response.message)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : 'Kunde inte nå servern. Försök igen.')
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return (
    <AuthActionCard title="Välj ett nytt lösenord" description="Använd ett unikt lösenord som du inte använder på andra webbplatser.">
      {message ? <p className="fv-auth-success" role="status">{message}</p>
        : !token ? <p className="fv-auth-error" role="alert">Återställningslänken saknas eller är ogiltig. Begär en ny länk.</p>
          : <form ref={form} className="fv-auth-form" onSubmit={submit} noValidate aria-busy={pending}>
            {error && <p className="fv-auth-error" role="alert">{error}</p>}
            <fieldset disabled={pending}>
              <PasswordField value={password} onChange={value => { setPassword(value); setPasswordError(undefined) }} error={passwordError} registering label="Nytt lösenord" />
              <PasswordField id="password-confirm" label="Bekräfta nytt lösenord" registering showStrength={false}
                value={confirmation} onChange={value => { setConfirmation(value); setConfirmationError(undefined) }} error={confirmationError} />
              <button className="fv-auth-submit" type="submit" disabled={pending}>{pending ? 'Sparar...' : 'Spara nytt lösenord'}</button>
            </fieldset>
          </form>}
      {!message && <button className="fv-auth-link mt-3" type="button" onClick={() => setForgotOpen(true)}>Begär en ny återställningslänk</button>}
      <p className="fv-auth-footer"><Link to="/logga-in">Till inloggningen</Link></p>
      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </AuthActionCard>
  )
}
