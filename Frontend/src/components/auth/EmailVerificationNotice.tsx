import { useTranslation } from '../../context/LocaleContext'
import { translateApiError, translateApiMessage } from '../../i18n/mappers'
import { sv } from '../../i18n/sv'
import { useEffect, useRef, useState } from 'react'
import { resendVerification } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

export default function EmailVerificationNotice() {
  const { user } = useAuth()
  return user && !user.isVerified ? <VerificationNotice key={user.id} /> : null
}

function VerificationNotice() {
  const { t, locale } = useTranslation()
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
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : sv['common.networkError'])
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return (
    <aside className="fv-verification-notice" aria-label={t('verification.label')}>
      <p>{verificationDeliveryFailed && !message
        ? t('verification.deliveryFailed')
        : t('verification.notice')}</p>
      <button type="button" className="fv-auth-link" disabled={pending} onClick={() => void resend()}>
        {t(pending ? 'verification.sending' : 'verification.resend')}
      </button>
      <p role="status">{translateApiMessage(message, locale)}</p>
      {error && <p role="alert">{translateApiError(error, locale)}</p>}
    </aside>
  )
}
