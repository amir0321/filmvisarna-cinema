import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { verifyEmail } from '../api/auth'
import { ApiError } from '../api/client'
import AuthActionCard from '../components/auth/AuthActionCard'
import { useAuth } from '../hooks/useAuth'
import { useAuthActionToken } from '../hooks/useAuthActionToken'

export default function VerifyEmail() {
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
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : 'Kunde inte nå servern. Försök igen.')
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return (
    <AuthActionCard title="Verifiera din e-postadress" description="Bekräfta att e-postadressen till ditt Filmvisarna-konto tillhör dig.">
      {message ? <p className="fv-auth-success" role="status">{message}</p>
        : !token ? <p className="fv-auth-error" role="alert">Verifieringslänken saknas eller är ogiltig. Logga in för att begära ett nytt verifieringsmejl.</p>
          : <>
            {error && <p className="fv-auth-error" role="alert">{error}</p>}
            <p>Länken kan användas en gång och gäller i 24 timmar. Klicka nedan för att bekräfta din adress.</p>
            <button className="fv-auth-submit" type="button" disabled={pending} onClick={() => void confirm()}>
              {pending ? 'Verifierar...' : 'Bekräfta e-postadress'}
            </button>
          </>}
      <p className="fv-auth-footer"><Link to={user ? '/' : '/logga-in'}>{user ? 'Till startsidan' : 'Till inloggningen'}</Link></p>
    </AuthActionCard>
  )
}
