import { useEffect, useRef, useState } from 'react'
import { resendVerification } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

export default function EmailVerificationNotice() {
  const { user } = useAuth()
  return user && !user.isVerified ? <VerificationNotice key={user.id} /> : null
}

function VerificationNotice() {
  const { refreshUser, verificationDeliveryFailed } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function resend() {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const response = await resendVerification(controller.signal)
      if (controller.signal.aborted) return
      setMessage(response.message)
      void refreshUser().catch(() => undefined)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : 'Kunde inte nå servern. Försök igen.')
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return (
    <aside className="fv-verification-notice" aria-label="E-postverifiering">
      <p>{verificationDeliveryFailed && !message
        ? 'Kontot är skapat, men verifieringsmejlet kunde inte skickas. Försök skicka det igen.'
        : 'Din e-postadress är inte verifierad. Bekräfta adressen via länken i verifieringsmejlet.'}</p>
      <button type="button" className="fv-auth-link" disabled={pending} onClick={() => void resend()}>
        {pending ? 'Skickar...' : 'Skicka nytt verifieringsmejl'}
      </button>
      <p role="status">{message}</p>
      {error && <p role="alert">{error}</p>}
    </aside>
  )
}
