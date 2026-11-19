import { useTranslation } from '../../context/LocaleContext'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { getPostLoginPath } from '../../utils/routeAccess'

export default function AuthCard({ registering, redirect, children }: { registering: boolean; redirect: string; children: ReactNode }) {
  const { t } = useTranslation()
  const { isAuthenticated, role, loading } = useAuth()
  const query = redirect === '/' ? '' : `?redirect=${encodeURIComponent(redirect)}`
  if (!loading && isAuthenticated) return <Navigate to={getPostLoginPath(redirect, role)} replace />
  return <section className="fv-auth-page" aria-labelledby="auth-title">
    <div className="fv-auth-card">
      <nav className="fv-tabs-segmented segmented-primary" aria-label={t('auth.navigation')}>
        <div className="fv-tab-list">
          <Link className={`fv-tab-trigger ${!registering ? 'active' : ''}`} aria-current={!registering ? 'page' : undefined} to={`/logga-in${query}`}>{t('nav.login')}</Link>
          <Link className={`fv-tab-trigger ${registering ? 'active' : ''}`} aria-current={registering ? 'page' : undefined} to={`/skapa-konto${query}`}>{t('nav.join')}</Link>
        </div>
      </nav>
      <div className="fv-auth-icon" aria-hidden="true"><i className={`bi ${registering ? 'bi-person-plus' : 'bi-person-lock'}`} /></div>
      <h1 id="auth-title">{registering ? t('auth.join') : t('auth.welcome')}</h1>
      <p className="fv-auth-intro">{registering ? t('auth.registerIntro') : t('auth.loginIntro')}</p>
      {loading ? <p role="status"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />{t('auth.checking')}</p> : children}
      <p className="fv-auth-footer">{registering ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
        <Link to={`${registering ? '/logga-in' : '/skapa-konto'}${query}`}>{registering ? t('nav.login') : t('auth.join')}</Link>
      </p>
    </div>
  </section>
}
