import { useEffect, useRef, useState, type FormEvent } from 'react'
import { forgotPassword } from '../../api/auth'
import { ApiError } from '../../api/client'
import { validateEmail } from '../../utils/authValidation'
import { Modal } from '../Modal'

function ForgotPasswordForm() {
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
    const invalid = validateEmail(email)
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
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : 'Kunde inte nå servern. Försök igen.')
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  if (message) return <p className="fv-auth-success" role="status">{message}</p>
  return (
    <form className="fv-auth-form" onSubmit={submit} noValidate aria-busy={pending}>
      <p>Ange e-postadressen till ditt konto så skickar vi en länk där du kan välja ett nytt lösenord.</p>
      {error && <p className="fv-auth-error" role="alert">{error}</p>}
      <div className="fv-auth-field">
        <label htmlFor="forgot-email">E-postadress</label>
        <input ref={input} id="forgot-email" type="email" autoComplete="email" required
          autoCapitalize="none" spellCheck={false} value={email} disabled={pending}
          onChange={event => { setEmail(event.target.value); setFieldError(undefined) }}
          aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? 'forgot-email-error' : undefined} />
        {fieldError && <p className="fv-auth-field-error" id="forgot-email-error">{fieldError}</p>}
      </div>
      <button type="submit" className="fv-auth-submit" disabled={pending}>
        {pending ? 'Skickar...' : 'Skicka återställningslänk'}
      </button>
    </form>
  )
}

export default function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Glömt lösenord?" size="sm">
      <Modal.Body>{isOpen && <ForgotPasswordForm />}</Modal.Body>
    </Modal>
  )
}
