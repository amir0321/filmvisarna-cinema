import { translateApiMessage, translateApiError } from '../i18n/mappers'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
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
  const { t, locale } = useTranslation()
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
    const invalid = validateNewPassword(password, locale)
    const mismatch = password !== confirmation ? t('auth.passwordMismatch') : undefined
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
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : sv['common.networkError'])
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return (
    <AuthActionCard title={t('auth.resetTitle')} description={t('auth.resetIntro')}>
      {message ? <p className="fv-auth-success" role="status">{translateApiMessage(message, locale)}</p>
        : !token ? <p className="fv-auth-error" role="alert">{t('auth.resetMissing')}</p>
          : <form ref={form} className="fv-auth-form" onSubmit={submit} noValidate aria-busy={pending}>
            {error && <p className="fv-auth-error" role="alert">{translateApiError(error, locale)}</p>}
            <fieldset disabled={pending}>
              <PasswordField value={password} onChange={value => { setPassword(value); setPasswordError(undefined) }} error={passwordError} registering label={t('auth.newPassword')} />
              <PasswordField id="password-confirm" label={t('auth.confirmPassword')} registering showStrength={false}
                value={confirmation} onChange={value => { setConfirmation(value); setConfirmationError(undefined) }} error={confirmationError} />
              <button className="fv-auth-submit" type="submit" disabled={pending}>{pending ? t('auth.saving') : t('auth.savePassword')}</button>
            </fieldset>
          </form>}
      {!message && <button className="fv-auth-link mt-3" type="button" onClick={() => setForgotOpen(true)}>{t('auth.requestReset')}</button>}
      <p className="fv-auth-footer"><Link to="/logga-in">{t('auth.backToLogin')}</Link></p>
      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </AuthActionCard>
  )
}
