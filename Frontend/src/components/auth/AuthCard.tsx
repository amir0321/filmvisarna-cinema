import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

export default function AuthCard({ registering, redirect, children }: { registering: boolean; redirect: string; children: ReactNode }) {
  const { user, loading } = useAuth()
  const query = redirect === '/' ? '' : `?redirect=${encodeURIComponent(redirect)}`
  if (!loading && user) return <Navigate to={redirect} replace />
  return <section className="fv-auth-page" aria-labelledby="auth-title">
    <div className="fv-auth-card">
      <nav className="fv-tabs-segmented segmented-primary" aria-label="Inloggning och registrering">
        <div className="fv-tab-list">
          <Link className={`fv-tab-trigger ${!registering ? 'active' : ''}`} aria-current={!registering ? 'page' : undefined} to={`/login${query}`}>Logga in</Link>
          <Link className={`fv-tab-trigger ${registering ? 'active' : ''}`} aria-current={registering ? 'page' : undefined} to={`/register${query}`}>Bli Medlem</Link>
        </div>
      </nav>
      <div className="fv-auth-icon" aria-hidden="true"><i className={`bi ${registering ? 'bi-person-plus' : 'bi-person-lock'}`} /></div>
      <h1 id="auth-title">{registering ? 'Bli medlem' : 'Välkommen tillbaka'}</h1>
      <p className="fv-auth-intro">{registering ? 'Skapa ett konto och samla dina biobesök på ett ställe.' : 'Logga in för att se dina bokningar och uppgifter.'}</p>
      {loading ? <p role="status"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Kontrollerar din inloggning...</p> : children}
      <p className="fv-auth-footer">{registering ? 'Har du redan ett konto? ' : 'Inte medlem ännu? '}
        <Link to={`${registering ? '/login' : '/register'}${query}`}>{registering ? 'Logga in' : 'Bli medlem'}</Link>
      </p>
    </div>
  </section>
}
