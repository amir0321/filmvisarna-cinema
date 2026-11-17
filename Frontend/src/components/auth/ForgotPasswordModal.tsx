import { translateApiMessage, translateApiError } from '../../i18n/mappers'
import { useTranslation } from '../../context/LocaleContext'
import { sv } from '../../i18n/sv'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { forgotPassword } from '../../api/auth'
import { ApiError } from '../../api/client'
import { validateEmail } from '../../utils/authValidation'
import { Modal } from '../Modal'

function ForgotPasswordForm() {
  const { t, locale } = useTranslation()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const request = useRef<AbortController | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (request.current) return
    const invalid = validateEmail(email, locale)
    setFieldError(invalid)
    if (invalid) { input.current?.focus(); return }
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const response = await forgotPassword(email.trim(), controller.signal)
      if (!controller.signal.aborted) setMessage(response.message)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : sv['common.networkError'])
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  if (message) return <p className="fv-auth-success" role="status">{translateApiMessage(message, locale)}</p>
  return (
    <form className="fv-auth-form" onSubmit={submit} noValidate aria-busy={pending}>
      <p>{t('auth.forgotIntro')}</p>
      {error && <p className="fv-auth-error" role="alert">{translateApiError(error, locale)}</p>}
      <div className="fv-auth-field">
        <label htmlFor="forgot-email">{t('form.email')}</label>
        <input ref={input} id="forgot-email" type="email" autoComplete="email" required
          autoCapitalize="none" spellCheck={false} value={email} disabled={pending}
          onChange={event => { setEmail(event.target.value); setFieldError(undefined) }}
          aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? 'forgot-email-error' : undefined} />
        {fieldError && <p className="fv-auth-field-error" id="forgot-email-error">{translateApiError(fieldError, locale)}</p>}
      </div>
      <button type="submit" className="fv-auth-submit" disabled={pending}>
        {pending ? t('verification.sending') : t('auth.sendReset')}
      </button>
    </form>
  )
}

export default function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auth.forgotPassword')} size="sm">
      <Modal.Body>{isOpen && <ForgotPasswordForm />}</Modal.Body>
    </Modal>
  )
}
