import { translateApiMessage, translateApiError } from '../i18n/mappers'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { verifyEmail } from '../api/auth'
import { ApiError } from '../api/client'
import AuthActionCard from '../components/auth/AuthActionCard'
import { useAuth } from '../hooks/useAuth'
import { useAuthActionToken } from '../hooks/useAuthActionToken'

export default function VerifyEmail() {
  const { t, locale } = useTranslation()
  const token = useAuthActionToken()
  const { user, refreshUser } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function confirm() {
    if (!token || request.current) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const response = await verifyEmail(token, controller.signal)
      if (controller.signal.aborted) return
      setMessage(response.message)
      if (user?.email === response.email) void refreshUser().catch(() => undefined)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : sv['common.networkError'])
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return (
    <AuthActionCard title={t('auth.verifyTitle')} description={t('auth.verifyIntro')}>
      {message ? <p className="fv-auth-success" role="status">{translateApiMessage(message, locale)}</p>
        : !token ? <p className="fv-auth-error" role="alert">{t('auth.verifyMissing')}</p>
          : <>
            {error && <p className="fv-auth-error" role="alert">{translateApiError(error, locale)}</p>}
            <p>{t('auth.verifyInstructions')}</p>
            <button className="fv-auth-submit" type="button" disabled={pending} onClick={() => void confirm()}>
              {pending ? t('auth.verifying') : t('auth.confirmEmail')}
            </button>
          </>}
      <p className="fv-auth-footer"><Link to={user ? '/' : '/logga-in'}>{user ? t('common.home') : t('auth.backToLogin')}</Link></p>
    </AuthActionCard>
  )
}
